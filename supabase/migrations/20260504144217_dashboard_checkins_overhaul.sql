-- Phase A — Dashboard / Program / Check-ins overhaul.
--
-- Adds:
--  * anvil_session_completion_sync_trigger — auto-flips clientWorkoutAssignments.status
--    to 'completed' and appends programdaykey into clientProgramAssignments.progress
--    when a workoutSessions row transitions into status='completed'.
--  * anvil_get_program_progress(uuid)         — per-day status table for a program.
--  * anvil_get_active_program_detail(uuid)    — one-row composite of program + counts.
--  * anvil_get_trainer_clients_without_active_program() — trainer roster slice.
--  * clientCheckIns table + RLS + 4 RPCs (get_by_date / upsert / reorder / delete).
--
-- Rollback: drop the trigger, drop the new RPCs, drop the table.
-- See `/docs/supabase/triggers.md`, `/docs/supabase/rpc-functions.md`,
-- `/docs/supabase/tables.md`, `/docs/supabase/rls-policies.md`.

begin;

------------------------------------------------------------------------------
-- A1. workoutSessions completion sync trigger
------------------------------------------------------------------------------

create or replace function public.anvil_session_completion_sync_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment public."clientWorkoutAssignments";
  v_keys jsonb;
begin
  if NEW.status = 'completed' and (OLD.status is distinct from 'completed') then
    if NEW.assignmentid is not null then
      update public."clientWorkoutAssignments"
        set status = 'completed', updatedat = now()
        where id = NEW.assignmentid
          and status <> 'completed'
      returning * into v_assignment;

      if v_assignment.id is null then
        select * into v_assignment
        from public."clientWorkoutAssignments"
        where id = NEW.assignmentid;
      end if;

      if v_assignment.id is not null
         and v_assignment.programassignmentid is not null
         and v_assignment.programdaykey is not null then
        v_keys := coalesce(
          (select progress->'completedDayKeys'
             from public."clientProgramAssignments"
             where id = v_assignment.programassignmentid),
          '[]'::jsonb
        );
        if not exists (
          select 1 from jsonb_array_elements_text(v_keys) t(k)
          where t.k = v_assignment.programdaykey
        ) then
          v_keys := v_keys || to_jsonb(v_assignment.programdaykey);
        end if;
        update public."clientProgramAssignments"
        set progress = jsonb_set(
              jsonb_set(
                coalesce(progress, '{}'::jsonb),
                '{completedDayKeys}',
                v_keys,
                true
              ),
              '{lastCompletedAt}',
              to_jsonb(now()),
              true
            ),
            updatedat = now()
        where id = v_assignment.programassignmentid;
      end if;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists anvil_session_completion_sync_trigger on public."workoutSessions";
create trigger anvil_session_completion_sync_trigger
  after update on public."workoutSessions"
  for each row execute function public.anvil_session_completion_sync_trigger();

-- Trigger function only fires from the trigger; nobody should be able to call it directly.
revoke execute on function public.anvil_session_completion_sync_trigger() from public, anon, authenticated;

------------------------------------------------------------------------------
-- A2. anvil_get_program_progress
------------------------------------------------------------------------------

create or replace function public.anvil_get_program_progress(p_program_assignment_id uuid)
returns table(
  daykey text,
  weekindex int,
  dayindex int,
  scheduledfor date,
  isrest boolean,
  workoutid uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_pa public."clientProgramAssignments";
  v_state jsonb;
  v_keys jsonb;
begin
  v_uid := public._require_auth_uid();

  select * into v_pa from public."clientProgramAssignments" where id = p_program_assignment_id;
  if v_pa.id is null then
    raise exception 'Program assignment not found';
  end if;

  if v_pa.clientid <> v_uid then
    if v_pa.trainerid <> v_uid then
      raise exception 'Not allowed';
    end if;
    perform public._require_trainer_link(v_pa.trainerid, v_pa.clientid);
  end if;

  select pt.state into v_state
  from public."programTemplates" pt
  where pt.id = v_pa.programtemplateid;
  if v_state is null then
    raise exception 'Program template state not found';
  end if;

  v_keys := coalesce(v_pa.progress->'completedDayKeys', '[]'::jsonb);

  return query
  with phases as (
    select coalesce((phase->>'order')::int, (p_ord - 1)::int) as phase_order, phase
    from jsonb_array_elements(coalesce(v_state->'phases', '[]'::jsonb)) with ordinality as p(phase, p_ord)
  ),
  weeks as (
    select ph.phase_order,
           coalesce((wk->>'index')::int, (w_ord - 1)::int) as src_week_index,
           wk
    from phases ph
    cross join lateral jsonb_array_elements(coalesce(ph.phase->'weeks', '[]'::jsonb)) with ordinality as w(wk, w_ord)
  ),
  days as (
    select w.phase_order,
           w.src_week_index,
           coalesce((dy->>'order')::int, (d_ord - 1)::int) as src_day_index,
           coalesce(
             nullif(dy->>'id', ''),
             format('phase_%s_week_%s_day_%s', w.phase_order, w.src_week_index, coalesce((dy->>'order')::int, (d_ord - 1)::int))
           ) as day_key,
           dy
    from weeks w
    cross join lateral jsonb_array_elements(coalesce(w.wk->'days', '[]'::jsonb)) with ordinality as d(dy, d_ord)
  ),
  ordered_days as (
    select d.day_key,
           d.dy,
           ((row_number() over (order by d.phase_order, d.src_week_index, d.src_day_index) - 1)::int) as global_index,
           (v_pa.startdate + ((row_number() over (order by d.phase_order, d.src_week_index, d.src_day_index) - 1)::int))::date as scheduled_for
    from days d
  ),
  resolved as (
    select od.day_key,
           (od.global_index / 7)::int as week_index,
           (od.global_index % 7)::int as day_index,
           od.scheduled_for,
           coalesce(od.dy->>'type','rest') = 'rest' as is_rest,
           case
             when (od.dy #>> '{workoutRef,workoutId}') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
               then (od.dy #>> '{workoutRef,workoutId}')::uuid
             when (od.dy #>> '{workouts,0,workoutId}') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
               then (od.dy #>> '{workouts,0,workoutId}')::uuid
             else null
           end as workout_id
    from ordered_days od
  )
  select
    r.day_key,
    r.week_index,
    r.day_index,
    r.scheduled_for,
    r.is_rest,
    r.workout_id,
    case
      when r.is_rest then 'rest'
      when (
        exists(
          select 1 from public."clientWorkoutAssignments" cwa
          where cwa.programassignmentid = p_program_assignment_id
            and cwa.programdaykey = r.day_key
            and cwa.status = 'completed'
        )
        or exists(
          select 1 from jsonb_array_elements_text(v_keys) t(k) where t.k = r.day_key
        )
      ) then 'completed'
      when r.scheduled_for < current_date then 'missed'
      else 'pending'
    end as status
  from resolved r
  order by r.week_index, r.day_index;
end;
$$;

revoke execute on function public.anvil_get_program_progress(uuid) from public, anon;
grant  execute on function public.anvil_get_program_progress(uuid) to authenticated;

------------------------------------------------------------------------------
-- A3. anvil_get_active_program_detail
------------------------------------------------------------------------------

create or replace function public.anvil_get_active_program_detail(p_assignment_id uuid)
returns table(
  assignmentid uuid,
  startdate date,
  status text,
  notes text,
  templateid uuid,
  title text,
  description text,
  difficulty text,
  durationweeks int,
  state jsonb,
  totaldays int,
  workoutdays int,
  restdays int,
  completeddays int,
  pendingdays int,
  misseddays int,
  expectedenddate date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_pa public."clientProgramAssignments";
  v_pt_id uuid;
  v_pt_title text;
  v_pt_description text;
  v_pt_difficulty text;
  v_pt_duration int;
  v_pt_state jsonb;
  v_total int;
  v_workout int;
  v_rest int;
  v_completed int;
  v_pending int;
  v_missed int;
begin
  v_uid := public._require_auth_uid();

  select * into v_pa from public."clientProgramAssignments" where id = p_assignment_id;
  if v_pa.id is null then
    raise exception 'Program assignment not found';
  end if;

  if v_pa.clientid <> v_uid then
    if v_pa.trainerid <> v_uid then
      raise exception 'Not allowed';
    end if;
    perform public._require_trainer_link(v_pa.trainerid, v_pa.clientid);
  end if;

  select pt.id, pt.title, pt.description, pt.difficulty::text, pt."durationWeeks", pt.state
    into v_pt_id, v_pt_title, v_pt_description, v_pt_difficulty, v_pt_duration, v_pt_state
  from public."programTemplates" pt
  where pt.id = v_pa.programtemplateid;

  if v_pt_id is null then
    raise exception 'Program template not found';
  end if;

  select
    count(*)::int,
    count(*) filter (where p.status <> 'rest')::int,
    count(*) filter (where p.status = 'rest')::int,
    count(*) filter (where p.status = 'completed')::int,
    count(*) filter (where p.status = 'pending')::int,
    count(*) filter (where p.status = 'missed')::int
  into v_total, v_workout, v_rest, v_completed, v_pending, v_missed
  from public.anvil_get_program_progress(p_assignment_id) p;

  return query select
    v_pa.id,
    v_pa.startdate,
    v_pa.status,
    v_pa.notes,
    v_pt_id,
    v_pt_title,
    v_pt_description,
    v_pt_difficulty,
    v_pt_duration,
    v_pt_state,
    v_total,
    v_workout,
    v_rest,
    v_completed,
    v_pending,
    v_missed,
    case when v_pt_duration is not null
      then (v_pa.startdate + (v_pt_duration * 7 - 1))::date
      else null::date
    end;
end;
$$;

revoke execute on function public.anvil_get_active_program_detail(uuid) from public, anon;
grant  execute on function public.anvil_get_active_program_detail(uuid) to authenticated;

------------------------------------------------------------------------------
-- A5. anvil_get_trainer_clients_without_active_program
------------------------------------------------------------------------------

create or replace function public.anvil_get_trainer_clients_without_active_program()
returns table(
  linkid uuid,
  clientid uuid,
  firstname text,
  lastname text,
  email text,
  avatarurl text,
  lastcheckinat timestamptz,
  clientstatus text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := public._require_auth_uid();

  return query
  select
    tc.id,
    u.id,
    u."firstName",
    u."lastName",
    u.email,
    u."avatarUrl",
    tcm."lastCheckInAt",
    coalesce(tcm."clientStatus"::text, 'active')
  from public."trainerClients" tc
  join public.users u on u.id = tc."clientId"
  left join public."trainerClientManagement" tcm
    on tcm."trainerId" = tc."trainerId"
   and tcm."clientId"  = tc."clientId"
  where tc."trainerId" = v_uid
    and tc.status = 'active'::link_status
    and not exists (
      select 1 from public."clientProgramAssignments" cpa
      where cpa.trainerid = v_uid
        and cpa.clientid  = tc."clientId"
        and cpa.status    = 'active'
    )
  order by u."firstName" nulls last, u."lastName" nulls last;
end;
$$;

revoke execute on function public.anvil_get_trainer_clients_without_active_program() from public, anon;
grant  execute on function public.anvil_get_trainer_clients_without_active_program() to authenticated;

------------------------------------------------------------------------------
-- A6. clientCheckIns table + RLS + RPCs
------------------------------------------------------------------------------

create table if not exists public."clientCheckIns" (
  id              uuid primary key default gen_random_uuid(),
  "trainerId"     uuid not null references public.users(id) on delete cascade,
  "clientId"      uuid not null references public.users(id) on delete cascade,
  "scheduledFor"  date not null,
  "scheduledTime" time without time zone null,
  "sortOrder"     int not null default 0,
  status          text not null default 'scheduled',
  notes           text null,
  "metricSummary" text null,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now(),
  constraint clientcheckins_status_check check (status in ('scheduled','completed','missed','cancelled'))
);

create index if not exists idx_clientcheckins_trainer_date_sort
  on public."clientCheckIns"("trainerId", "scheduledFor", "sortOrder");
create index if not exists idx_clientcheckins_client_date
  on public."clientCheckIns"("clientId", "scheduledFor");

alter table public."clientCheckIns" enable row level security;

drop trigger if exists trg_clientcheckins_updatedat on public."clientCheckIns";
create trigger trg_clientcheckins_updatedat
  before update on public."clientCheckIns"
  for each row execute function public.set_updated_at();

drop policy if exists clientcheckins_select_participant on public."clientCheckIns";
drop policy if exists clientcheckins_insert_trainer    on public."clientCheckIns";
drop policy if exists clientcheckins_update_trainer    on public."clientCheckIns";
drop policy if exists clientcheckins_delete_trainer    on public."clientCheckIns";

create policy clientcheckins_select_participant on public."clientCheckIns"
  for select to authenticated
  using (
    (select auth.uid()) = "trainerId"
    or (
      (select auth.uid()) = "clientId"
      and exists (
        select 1 from public."trainerClients" tc
        where tc."trainerId" = public."clientCheckIns"."trainerId"
          and tc."clientId"  = public."clientCheckIns"."clientId"
          and tc.status      = 'active'::link_status
      )
    )
  );

create policy clientcheckins_insert_trainer on public."clientCheckIns"
  for insert to authenticated
  with check (
    (select auth.uid()) = "trainerId"
    and exists (
      select 1 from public."trainerClients" tc
      where tc."trainerId" = (select auth.uid())
        and tc."clientId"  = public."clientCheckIns"."clientId"
        and tc.status      = 'active'::link_status
    )
  );

create policy clientcheckins_update_trainer on public."clientCheckIns"
  for update to authenticated
  using (
    (select auth.uid()) = "trainerId"
    and exists (
      select 1 from public."trainerClients" tc
      where tc."trainerId" = (select auth.uid())
        and tc."clientId"  = public."clientCheckIns"."clientId"
        and tc.status      = 'active'::link_status
    )
  )
  with check (
    (select auth.uid()) = "trainerId"
    and exists (
      select 1 from public."trainerClients" tc
      where tc."trainerId" = (select auth.uid())
        and tc."clientId"  = public."clientCheckIns"."clientId"
        and tc.status      = 'active'::link_status
    )
  );

create policy clientcheckins_delete_trainer on public."clientCheckIns"
  for delete to authenticated
  using ((select auth.uid()) = "trainerId");

-- A6 RPC: anvil_get_trainer_checkins_by_date
create or replace function public.anvil_get_trainer_checkins_by_date(p_date date)
returns table(
  id uuid,
  trainerid uuid,
  clientid uuid,
  scheduledfor date,
  scheduledtime time,
  sortorder int,
  status text,
  notes text,
  metricsummary text,
  createdat timestamptz,
  updatedat timestamptz,
  clientfirstname text,
  clientlastname text,
  clientavatarurl text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := public._require_auth_uid();
  return query
  select
    ci.id,
    ci."trainerId",
    ci."clientId",
    ci."scheduledFor",
    ci."scheduledTime",
    ci."sortOrder",
    ci.status,
    ci.notes,
    ci."metricSummary",
    ci."createdAt",
    ci."updatedAt",
    u."firstName",
    u."lastName",
    u."avatarUrl"
  from public."clientCheckIns" ci
  join public.users u on u.id = ci."clientId"
  where ci."trainerId"   = v_uid
    and ci."scheduledFor" = p_date
  order by ci."sortOrder" asc, ci."scheduledTime" asc nulls last, ci."createdAt" asc;
end;
$$;

revoke execute on function public.anvil_get_trainer_checkins_by_date(date) from public, anon;
grant  execute on function public.anvil_get_trainer_checkins_by_date(date) to authenticated;

-- A6 RPC: anvil_upsert_client_checkin
create or replace function public.anvil_upsert_client_checkin(
  p_id uuid,
  p_client_id uuid,
  p_scheduled_for date,
  p_scheduled_time time default null,
  p_status text default 'scheduled',
  p_notes text default null,
  p_metric_summary text default null,
  p_sort_order int default null
)
returns public."clientCheckIns"
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_row public."clientCheckIns";
  v_status text := coalesce(p_status, 'scheduled');
  v_sort int;
begin
  v_uid := public._require_auth_uid();
  perform public._require_trainer_link(v_uid, p_client_id);

  if v_status not in ('scheduled','completed','missed','cancelled') then
    raise exception 'Invalid check-in status: %', v_status;
  end if;

  if p_id is not null then
    update public."clientCheckIns"
      set "clientId"      = p_client_id,
          "scheduledFor"  = p_scheduled_for,
          "scheduledTime" = p_scheduled_time,
          status          = v_status,
          notes           = p_notes,
          "metricSummary" = p_metric_summary,
          "sortOrder"     = coalesce(p_sort_order, "sortOrder")
      where id = p_id
        and "trainerId" = v_uid
      returning * into v_row;
    if v_row.id is null then
      raise exception 'Check-in not found or not owned by caller';
    end if;
    return v_row;
  end if;

  if p_sort_order is null then
    select coalesce(max("sortOrder"), 0) + 1 into v_sort
      from public."clientCheckIns"
      where "trainerId"    = v_uid
        and "scheduledFor" = p_scheduled_for;
  else
    v_sort := p_sort_order;
  end if;

  insert into public."clientCheckIns" (
    "trainerId", "clientId", "scheduledFor", "scheduledTime",
    "sortOrder", status, notes, "metricSummary"
  ) values (
    v_uid, p_client_id, p_scheduled_for, p_scheduled_time,
    v_sort, v_status, p_notes, p_metric_summary
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.anvil_upsert_client_checkin(uuid, uuid, date, time, text, text, text, int) from public, anon;
grant  execute on function public.anvil_upsert_client_checkin(uuid, uuid, date, time, text, text, text, int) to authenticated;

-- A6 RPC: anvil_reorder_client_checkin
create or replace function public.anvil_reorder_client_checkin(
  p_checkin_id uuid,
  p_sort_order int,
  p_scheduled_time time default null,
  p_scheduled_for date default null
)
returns public."clientCheckIns"
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_row public."clientCheckIns";
begin
  v_uid := public._require_auth_uid();

  update public."clientCheckIns"
    set "sortOrder"     = p_sort_order,
        "scheduledTime" = coalesce(p_scheduled_time, "scheduledTime"),
        "scheduledFor"  = coalesce(p_scheduled_for, "scheduledFor")
    where id = p_checkin_id
      and "trainerId" = v_uid
    returning * into v_row;

  if v_row.id is null then
    raise exception 'Check-in not found or not owned by caller';
  end if;

  return v_row;
end;
$$;

revoke execute on function public.anvil_reorder_client_checkin(uuid, int, time, date) from public, anon;
grant  execute on function public.anvil_reorder_client_checkin(uuid, int, time, date) to authenticated;

-- A6 RPC: anvil_delete_client_checkin
create or replace function public.anvil_delete_client_checkin(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_count int;
begin
  v_uid := public._require_auth_uid();

  delete from public."clientCheckIns"
   where id = p_id
     and "trainerId" = v_uid;
  get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception 'Check-in not found or not owned by caller';
  end if;

  return true;
end;
$$;

revoke execute on function public.anvil_delete_client_checkin(uuid) from public, anon;
grant  execute on function public.anvil_delete_client_checkin(uuid) to authenticated;

commit;
