-- Add optional workout schedule time support with a default slot.
-- Existing rows are backfilled to 08:00:00 so timeline views are deterministic.

alter table public."clientWorkoutAssignments"
  add column if not exists scheduledtime time without time zone;

update public."clientWorkoutAssignments"
set scheduledtime = time '08:00:00'
where scheduledtime is null;

alter table public."clientWorkoutAssignments"
  alter column scheduledtime set default time '08:00:00';

alter table public."clientWorkoutAssignments"
  alter column scheduledtime set not null;

create or replace function public.generate_program_workout_assignments(
  p_program_assignment_id uuid,
  p_replace_existing boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_pa public."clientProgramAssignments";
  v_state jsonb;
  v_inserted int := 0;
begin
  v_uid := public._require_auth_uid();

  select * into v_pa
  from public."clientProgramAssignments"
  where id = p_program_assignment_id;

  if v_pa.id is null then
    raise exception 'Program assignment not found';
  end if;

  if v_pa.trainerid <> v_uid then
    raise exception 'Not allowed';
  end if;

  perform public._require_trainer_link(v_pa.trainerid, v_pa.clientid);

  select pt.state
  into v_state
  from public."programTemplates" pt
  where pt.id = v_pa.programtemplateid;

  if v_state is null then
    raise exception 'Program template state not found';
  end if;

  create temporary table if not exists _tmp_program_day_workouts (
    day_key text not null,
    workout_id uuid not null,
    scheduled_for date not null
  ) on commit drop;

  truncate table _tmp_program_day_workouts;

  with phases as (
    select
      coalesce((phase->>'order')::int, p_ord - 1) as phase_order,
      phase
    from jsonb_array_elements(coalesce(v_state->'phases', '[]'::jsonb)) with ordinality as p(phase, p_ord)
  ),
  weeks as (
    select
      ph.phase_order,
      coalesce((wk->>'index')::int, w_ord - 1) as week_index,
      wk
    from phases ph
    cross join lateral jsonb_array_elements(coalesce(ph.phase->'weeks', '[]'::jsonb)) with ordinality as w(wk, w_ord)
  ),
  days as (
    select
      w.phase_order,
      w.week_index,
      coalesce((dy->>'order')::int, d_ord - 1) as day_order,
      coalesce(
        nullif(dy->>'id', ''),
        format('phase_%s_week_%s_day_%s', w.phase_order, w.week_index, coalesce((dy->>'order')::int, d_ord - 1))
      ) as day_key,
      dy
    from weeks w
    cross join lateral jsonb_array_elements(coalesce(w.wk->'days', '[]'::jsonb)) with ordinality as d(dy, d_ord)
  ),
  scheduled_days as (
    select
      d.day_key,
      d.dy,
      (
        v_pa.startdate
        + ((row_number() over (order by d.phase_order, d.week_index, d.day_order) - 1)::int)
      )::date as scheduled_for
    from days d
  ),
  raw_days as (
    select
      sd.day_key,
      sd.scheduled_for,
      coalesce(
        sd.dy #>> '{workoutRef,workoutId}',
        sd.dy #>> '{workouts,0,workoutId}'
      ) as workout_id_text
    from scheduled_days sd
    where coalesce(sd.dy->>'type', 'rest') = 'workout'
  ),
  valid_days as (
    select
      rd.day_key,
      rd.scheduled_for,
      rd.workout_id_text::uuid as workout_id
    from raw_days rd
    where rd.workout_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  )
  insert into _tmp_program_day_workouts(day_key, workout_id, scheduled_for)
  select
    vd.day_key,
    vd.workout_id,
    vd.scheduled_for
  from valid_days vd
  join public.workouts w on w.id = vd.workout_id;

  if (select count(*) from _tmp_program_day_workouts) = 0 then
    return 0;
  end if;

  if p_replace_existing then
    delete from public."clientWorkoutAssignments"
    where programassignmentid = p_program_assignment_id;
  end if;

  insert into public."clientWorkoutAssignments" (
    trainerid,
    clientid,
    workoutid,
    scheduledfor,
    scheduledtime,
    status,
    source,
    programassignmentid,
    programdaykey,
    createdat,
    updatedat
  )
  select
    v_pa.trainerid,
    v_pa.clientid,
    t.workout_id,
    t.scheduled_for,
    time '08:00:00',
    'assigned',
    'program',
    p_program_assignment_id,
    t.day_key,
    now(),
    now()
  from _tmp_program_day_workouts t
  on conflict (clientid, programassignmentid, programdaykey)
  where programassignmentid is not null
  do update
    set workoutid = excluded.workoutid,
        scheduledfor = excluded.scheduledfor,
        scheduledtime = public."clientWorkoutAssignments".scheduledtime,
        status = excluded.status,
        source = excluded.source,
        updatedat = now();

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.assign_client_workout_template(
  p_client_id uuid,
  p_workout_id uuid,
  p_scheduled_for date,
  p_scheduled_time time default null,
  p_source text default 'manual',
  p_program_assignment_id uuid default null,
  p_program_day_key text default null,
  p_overwrite_existing boolean default false
)
returns public."clientWorkoutAssignments"
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_trainer_id uuid;
  v_row public."clientWorkoutAssignments";
  v_slot_time time := coalesce(p_scheduled_time, time '08:00:00');
begin
  v_trainer_id := auth.uid();
  if v_trainer_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public."trainerClients" tc
    where tc."trainerId" = v_trainer_id
      and tc."clientId" = p_client_id
      and tc.status = 'active'::link_status
  ) then
    raise exception 'Client not linked';
  end if;

  if not exists (select 1 from public.workouts w where w.id = p_workout_id) then
    raise exception 'Workout not found';
  end if;

  if coalesce(p_source, 'manual') = 'manual' and not p_overwrite_existing then
    if exists (
      select 1
      from public."clientWorkoutAssignments" cwa
      where cwa.clientid = p_client_id
        and cwa.scheduledfor = p_scheduled_for
        and cwa.scheduledtime = v_slot_time
        and cwa.trainerid = v_trainer_id
    ) then
      raise exception 'Workout already scheduled for this time slot';
    end if;
  end if;

  if p_overwrite_existing then
    delete from public."clientWorkoutAssignments" cwa
    where cwa.clientid = p_client_id
      and cwa.scheduledfor = p_scheduled_for
      and cwa.scheduledtime = v_slot_time
      and cwa.trainerid = v_trainer_id;
  end if;

  insert into public."clientWorkoutAssignments"(
    trainerid, clientid, workoutid, scheduledfor, scheduledtime, status, source, programassignmentid, programdaykey
  )
  values (
    v_trainer_id, p_client_id, p_workout_id, p_scheduled_for, v_slot_time, 'assigned', p_source, p_program_assignment_id, p_program_day_key
  )
  on conflict (clientid, workoutid, scheduledfor)
  where programassignmentid is null
  do update
    set updatedat = now(),
        trainerid = excluded.trainerid,
        source = excluded.source,
        scheduledtime = excluded.scheduledtime
  returning * into v_row;

  if v_row.id is not null then
    return v_row;
  end if;

  return v_row;
exception
  when unique_violation then
    select *
    into v_row
    from public."clientWorkoutAssignments" cwa
    where cwa.clientid = p_client_id
      and cwa.workoutid = p_workout_id
      and cwa.scheduledfor = p_scheduled_for
      and coalesce(cwa.source, 'manual') = coalesce(p_source, 'manual')
    order by cwa.createdat desc
    limit 1;

    if v_row.id is null then
      raise;
    end if;

    return v_row;
end;
$$;

drop function if exists public.assign_client_workout_template(
  uuid, uuid, date, text, uuid, text, boolean
);

create or replace function public.get_my_workout_schedule(p_from date default null, p_to date default null)
returns setof public."clientWorkoutAssignments"
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
begin
  v_uid := public._require_auth_uid();

  return query
  select *
  from public."clientWorkoutAssignments"
  where clientid = v_uid
    and (p_from is null or scheduledfor >= p_from)
    and (p_to is null or scheduledfor <= p_to)
  order by scheduledfor asc, scheduledtime asc, createdat asc;
end;
$$;

revoke all on function public.assign_client_workout_template(
  uuid, uuid, date, time, text, uuid, text, boolean
) from public;
grant execute on function public.assign_client_workout_template(
  uuid, uuid, date, time, text, uuid, text, boolean
) to authenticated;

create index if not exists idx_client_workout_assignments_client_schedule_slot
  on public."clientWorkoutAssignments"(clientid, scheduledfor, scheduledtime);

create index if not exists idx_client_workout_assignments_trainer_client_schedule_slot
  on public."clientWorkoutAssignments"(trainerid, clientid, scheduledfor, scheduledtime);

