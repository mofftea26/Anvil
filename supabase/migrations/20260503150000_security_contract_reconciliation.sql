-- Security + contract reconciliation for assignments, sessions, logs, and linking.
-- This migration is idempotent and safe to re-run.

-- -----------------------------------------------------------------------------
-- Phase 1: tighten grants and enable RLS on sensitive tables
-- -----------------------------------------------------------------------------

revoke all on table public."clientProgramAssignments" from anon, authenticated;
revoke all on table public."clientWorkoutAssignments" from anon, authenticated;
revoke all on table public."workoutSessions" from anon, authenticated;
revoke all on table public."workoutSetLogs" from anon, authenticated;
revoke all on table public."workoutStatsDaily" from anon, authenticated;
revoke all on table public."workoutSeriesBlocks" from anon, authenticated;
revoke all on table public."workoutSeriesExercises" from anon, authenticated;
revoke all on table public."workoutSetPrescriptions" from anon, authenticated;

grant select, insert, update, delete on table public."clientProgramAssignments" to authenticated;
grant select, insert, update, delete on table public."clientWorkoutAssignments" to authenticated;
grant select, insert, update, delete on table public."workoutSessions" to authenticated;
grant select, insert, update, delete on table public."workoutSetLogs" to authenticated;
grant select, insert, update, delete on table public."workoutStatsDaily" to authenticated;
grant select, insert, update, delete on table public."workoutSeriesBlocks" to authenticated;
grant select, insert, update, delete on table public."workoutSeriesExercises" to authenticated;
grant select, insert, update, delete on table public."workoutSetPrescriptions" to authenticated;

alter table public."clientProgramAssignments" enable row level security;
alter table public."clientWorkoutAssignments" enable row level security;
alter table public."workoutSessions" enable row level security;
alter table public."workoutSetLogs" enable row level security;
alter table public."workoutStatsDaily" enable row level security;
alter table public."workoutSeriesBlocks" enable row level security;
alter table public."workoutSeriesExercises" enable row level security;
alter table public."workoutSetPrescriptions" enable row level security;

-- Remove legacy/duplicate policies before re-creating canonical set.
drop policy if exists client_program_assignments_select on public."clientProgramAssignments";
drop policy if exists client_program_assignments_insert on public."clientProgramAssignments";
drop policy if exists client_program_assignments_update on public."clientProgramAssignments";
drop policy if exists client_program_assignments_delete on public."clientProgramAssignments";
drop policy if exists client_program_assignments_select_participant on public."clientProgramAssignments";
drop policy if exists client_program_assignments_insert_trainer on public."clientProgramAssignments";
drop policy if exists client_program_assignments_update_trainer on public."clientProgramAssignments";
drop policy if exists client_program_assignments_update_client on public."clientProgramAssignments";
drop policy if exists client_program_assignments_delete_trainer on public."clientProgramAssignments";

drop policy if exists client_workout_assignments_select on public."clientWorkoutAssignments";
drop policy if exists client_workout_assignments_insert on public."clientWorkoutAssignments";
drop policy if exists client_workout_assignments_update on public."clientWorkoutAssignments";
drop policy if exists client_workout_assignments_delete on public."clientWorkoutAssignments";
drop policy if exists client_workout_assignments_select_participant on public."clientWorkoutAssignments";
drop policy if exists client_workout_assignments_insert_trainer on public."clientWorkoutAssignments";
drop policy if exists client_workout_assignments_update_trainer on public."clientWorkoutAssignments";
drop policy if exists client_workout_assignments_update_client on public."clientWorkoutAssignments";
drop policy if exists client_workout_assignments_delete_trainer on public."clientWorkoutAssignments";

drop policy if exists workout_sessions_select on public."workoutSessions";
drop policy if exists workout_sessions_insert on public."workoutSessions";
drop policy if exists workout_sessions_update on public."workoutSessions";
drop policy if exists workout_sessions_delete on public."workoutSessions";
drop policy if exists workout_sessions_select_participant on public."workoutSessions";
drop policy if exists workout_sessions_insert_client on public."workoutSessions";
drop policy if exists workout_sessions_update_participant on public."workoutSessions";
drop policy if exists workout_sessions_delete_trainer on public."workoutSessions";

drop policy if exists workout_set_logs_select on public."workoutSetLogs";
drop policy if exists workout_set_logs_insert on public."workoutSetLogs";
drop policy if exists workout_set_logs_update on public."workoutSetLogs";
drop policy if exists workout_set_logs_delete on public."workoutSetLogs";
drop policy if exists workout_set_logs_select_participant on public."workoutSetLogs";
drop policy if exists workout_set_logs_insert_participant on public."workoutSetLogs";
drop policy if exists workout_set_logs_update_participant on public."workoutSetLogs";
drop policy if exists workout_set_logs_delete_participant on public."workoutSetLogs";

drop policy if exists workout_stats_daily_select on public."workoutStatsDaily";
drop policy if exists workout_stats_daily_insert on public."workoutStatsDaily";
drop policy if exists workout_stats_daily_update on public."workoutStatsDaily";
drop policy if exists workout_stats_daily_delete on public."workoutStatsDaily";
drop policy if exists workout_stats_daily_select_own on public."workoutStatsDaily";
drop policy if exists workout_stats_daily_insert_own on public."workoutStatsDaily";
drop policy if exists workout_stats_daily_update_own on public."workoutStatsDaily";
drop policy if exists workout_stats_daily_delete_own on public."workoutStatsDaily";

drop policy if exists workout_series_blocks_select on public."workoutSeriesBlocks";
drop policy if exists workout_series_blocks_insert on public."workoutSeriesBlocks";
drop policy if exists workout_series_blocks_update on public."workoutSeriesBlocks";
drop policy if exists workout_series_blocks_delete on public."workoutSeriesBlocks";
drop policy if exists workout_series_blocks_select_accessible on public."workoutSeriesBlocks";
drop policy if exists workout_series_blocks_write_owner on public."workoutSeriesBlocks";

drop policy if exists workout_series_exercises_select on public."workoutSeriesExercises";
drop policy if exists workout_series_exercises_insert on public."workoutSeriesExercises";
drop policy if exists workout_series_exercises_update on public."workoutSeriesExercises";
drop policy if exists workout_series_exercises_delete on public."workoutSeriesExercises";
drop policy if exists workout_series_exercises_select_accessible on public."workoutSeriesExercises";
drop policy if exists workout_series_exercises_write_owner on public."workoutSeriesExercises";

drop policy if exists workout_set_prescriptions_select on public."workoutSetPrescriptions";
drop policy if exists workout_set_prescriptions_insert on public."workoutSetPrescriptions";
drop policy if exists workout_set_prescriptions_update on public."workoutSetPrescriptions";
drop policy if exists workout_set_prescriptions_delete on public."workoutSetPrescriptions";
drop policy if exists workout_set_prescriptions_select_accessible on public."workoutSetPrescriptions";
drop policy if exists workout_set_prescriptions_write_owner on public."workoutSetPrescriptions";

create policy client_program_assignments_select_participant
on public."clientProgramAssignments"
for select
to authenticated
using (
  auth.uid() = clientid
  or (
    auth.uid() = trainerid
    and exists (
      select 1
      from public."trainerClients" tc
      where tc."trainerId" = auth.uid()
        and tc."clientId" = clientid
        and tc.status = any (array['active'::link_status, 'archived'::link_status])
    )
  )
);

create policy client_program_assignments_insert_trainer
on public."clientProgramAssignments"
for insert
to authenticated
with check (
  auth.uid() = trainerid
  and exists (
    select 1
    from public."trainerClients" tc
    where tc."trainerId" = auth.uid()
      and tc."clientId" = clientid
      and tc.status = 'active'::link_status
  )
);

create policy client_program_assignments_update_trainer
on public."clientProgramAssignments"
for update
to authenticated
using (
  auth.uid() = trainerid
  and exists (
    select 1
    from public."trainerClients" tc
    where tc."trainerId" = auth.uid()
      and tc."clientId" = clientid
      and tc.status = any (array['active'::link_status, 'archived'::link_status])
  )
)
with check (
  auth.uid() = trainerid
);

create policy client_program_assignments_update_client
on public."clientProgramAssignments"
for update
to authenticated
using (auth.uid() = clientid)
with check (auth.uid() = clientid);

create policy client_program_assignments_delete_trainer
on public."clientProgramAssignments"
for delete
to authenticated
using (auth.uid() = trainerid);

create policy client_workout_assignments_select_participant
on public."clientWorkoutAssignments"
for select
to authenticated
using (
  auth.uid() = clientid
  or (
    auth.uid() = trainerid
    and exists (
      select 1
      from public."trainerClients" tc
      where tc."trainerId" = auth.uid()
        and tc."clientId" = clientid
        and tc.status = any (array['active'::link_status, 'archived'::link_status])
    )
  )
);

create policy client_workout_assignments_insert_trainer
on public."clientWorkoutAssignments"
for insert
to authenticated
with check (
  auth.uid() = trainerid
  and exists (
    select 1
    from public."trainerClients" tc
    where tc."trainerId" = auth.uid()
      and tc."clientId" = clientid
      and tc.status = 'active'::link_status
  )
);

create policy client_workout_assignments_update_participant
on public."clientWorkoutAssignments"
for update
to authenticated
using (auth.uid() = trainerid or auth.uid() = clientid)
with check (auth.uid() = trainerid or auth.uid() = clientid);

create policy client_workout_assignments_delete_trainer
on public."clientWorkoutAssignments"
for delete
to authenticated
using (auth.uid() = trainerid);

create policy workout_sessions_select_participant
on public."workoutSessions"
for select
to authenticated
using (auth.uid() = clientid or auth.uid() = trainerid);

create policy workout_sessions_insert_client
on public."workoutSessions"
for insert
to authenticated
with check (
  auth.uid() = clientid
  and (
    assignmentid is null
    or exists (
      select 1
      from public."clientWorkoutAssignments" cwa
      where cwa.id = assignmentid
        and cwa.clientid = auth.uid()
    )
  )
);

create policy workout_sessions_update_participant
on public."workoutSessions"
for update
to authenticated
using (auth.uid() = clientid or auth.uid() = trainerid)
with check (auth.uid() = clientid or auth.uid() = trainerid);

create policy workout_sessions_delete_trainer
on public."workoutSessions"
for delete
to authenticated
using (auth.uid() = trainerid);

create policy workout_set_logs_select_participant
on public."workoutSetLogs"
for select
to authenticated
using (
  exists (
    select 1
    from public."workoutSessions" s
    where s.id = sessionid
      and (s.clientid = auth.uid() or s.trainerid = auth.uid())
  )
);

create policy workout_set_logs_insert_participant
on public."workoutSetLogs"
for insert
to authenticated
with check (
  exists (
    select 1
    from public."workoutSessions" s
    where s.id = sessionid
      and (s.clientid = auth.uid() or s.trainerid = auth.uid())
  )
);

create policy workout_set_logs_update_participant
on public."workoutSetLogs"
for update
to authenticated
using (
  exists (
    select 1
    from public."workoutSessions" s
    where s.id = sessionid
      and (s.clientid = auth.uid() or s.trainerid = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public."workoutSessions" s
    where s.id = sessionid
      and (s.clientid = auth.uid() or s.trainerid = auth.uid())
  )
);

create policy workout_set_logs_delete_participant
on public."workoutSetLogs"
for delete
to authenticated
using (
  exists (
    select 1
    from public."workoutSessions" s
    where s.id = sessionid
      and (s.clientid = auth.uid() or s.trainerid = auth.uid())
  )
);

create policy workout_stats_daily_select_own
on public."workoutStatsDaily"
for select
to authenticated
using (auth.uid() = clientid);

create policy workout_stats_daily_insert_own
on public."workoutStatsDaily"
for insert
to authenticated
with check (auth.uid() = clientid);

create policy workout_stats_daily_update_own
on public."workoutStatsDaily"
for update
to authenticated
using (auth.uid() = clientid)
with check (auth.uid() = clientid);

create policy workout_stats_daily_delete_own
on public."workoutStatsDaily"
for delete
to authenticated
using (auth.uid() = clientid);

create policy workout_series_blocks_select_accessible
on public."workoutSeriesBlocks"
for select
to authenticated
using (
  exists (
    select 1
    from public.workouts w
    where w.id = "workoutTemplateId"
      and (
        w."trainerId" = auth.uid()
        or exists (
          select 1
          from public."clientWorkoutAssignments" cwa
          where cwa.workoutid = w.id
            and cwa.clientid = auth.uid()
        )
      )
  )
);

create policy workout_series_blocks_write_owner
on public."workoutSeriesBlocks"
for all
to authenticated
using (
  exists (
    select 1
    from public.workouts w
    where w.id = "workoutTemplateId"
      and w."trainerId" = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workouts w
    where w.id = "workoutTemplateId"
      and w."trainerId" = auth.uid()
  )
);

create policy workout_series_exercises_select_accessible
on public."workoutSeriesExercises"
for select
to authenticated
using (
  exists (
    select 1
    from public."workoutSeriesBlocks" b
    join public.workouts w on w.id = b."workoutTemplateId"
    where b.id = "seriesBlockId"
      and (
        w."trainerId" = auth.uid()
        or exists (
          select 1
          from public."clientWorkoutAssignments" cwa
          where cwa.workoutid = w.id
            and cwa.clientid = auth.uid()
        )
      )
  )
);

create policy workout_series_exercises_write_owner
on public."workoutSeriesExercises"
for all
to authenticated
using (
  exists (
    select 1
    from public."workoutSeriesBlocks" b
    join public.workouts w on w.id = b."workoutTemplateId"
    where b.id = "seriesBlockId"
      and w."trainerId" = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public."workoutSeriesBlocks" b
    join public.workouts w on w.id = b."workoutTemplateId"
    where b.id = "seriesBlockId"
      and w."trainerId" = auth.uid()
  )
);

create policy workout_set_prescriptions_select_accessible
on public."workoutSetPrescriptions"
for select
to authenticated
using (
  exists (
    select 1
    from public."workoutSeriesExercises" se
    join public."workoutSeriesBlocks" b on b.id = se."seriesBlockId"
    join public.workouts w on w.id = b."workoutTemplateId"
    where se.id = "seriesExerciseId"
      and (
        w."trainerId" = auth.uid()
        or exists (
          select 1
          from public."clientWorkoutAssignments" cwa
          where cwa.workoutid = w.id
            and cwa.clientid = auth.uid()
        )
      )
  )
);

create policy workout_set_prescriptions_write_owner
on public."workoutSetPrescriptions"
for all
to authenticated
using (
  exists (
    select 1
    from public."workoutSeriesExercises" se
    join public."workoutSeriesBlocks" b on b.id = se."seriesBlockId"
    join public.workouts w on w.id = b."workoutTemplateId"
    where se.id = "seriesExerciseId"
      and w."trainerId" = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public."workoutSeriesExercises" se
    join public."workoutSeriesBlocks" b on b.id = se."seriesBlockId"
    join public.workouts w on w.id = b."workoutTemplateId"
    where se.id = "seriesExerciseId"
      and w."trainerId" = auth.uid()
  )
);

drop policy if exists workouts_select_assigned_client on public.workouts;
create policy workouts_select_assigned_client
on public.workouts
for select
to authenticated
using (
  exists (
    select 1
    from public."clientWorkoutAssignments" cwa
    where cwa.workoutid = workouts.id
      and cwa.clientid = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- Phase 1b: storage policy cleanup
-- -----------------------------------------------------------------------------

drop policy if exists read_own_avatars on storage.objects;
drop policy if exists upload_own_avatars on storage.objects;
drop policy if exists update_own_avatars on storage.objects;
drop policy if exists trainer_brand_read on storage.objects;
drop policy if exists trainer_brand_insert_own on storage.objects;
drop policy if exists trainer_brand_update_own on storage.objects;
drop policy if exists trainer_brand_delete_own on storage.objects;

drop policy if exists avatars_read on storage.objects;
drop policy if exists avatars_select_own on storage.objects;
drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;

drop policy if exists logos_read on storage.objects;
drop policy if exists logos_select_own on storage.objects;
drop policy if exists logos_insert_own on storage.objects;
drop policy if exists logos_update_own on storage.objects;
drop policy if exists logos_delete_own on storage.objects;

create policy avatars_read
on storage.objects
for select
to authenticated
using (bucket_id = 'avatars');

create policy avatars_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy avatars_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy avatars_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy logos_read
on storage.objects
for select
to authenticated
using (bucket_id = 'logos');

create policy logos_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy logos_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy logos_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- -----------------------------------------------------------------------------
-- Phase 2 + 3: RPC and function contract fixes
-- -----------------------------------------------------------------------------

create or replace function public.anvil_upsert_trainer_client_management(
  p_client_id uuid,
  p_client_status client_status default null,
  p_coach_notes text default null,
  p_tags text[] default null,
  p_check_in_frequency checkin_frequency default null,
  p_next_check_in_at timestamptz default null
)
returns public."trainerClientManagement"
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_trainer_id uuid;
  v_role public.user_role;
  v_row public."trainerClientManagement";
begin
  v_trainer_id := auth.uid();
  if v_trainer_id is null then
    raise exception 'Not authenticated';
  end if;

  select "role" into v_role from public.users where id = v_trainer_id;
  if v_role <> 'trainer' then
    raise exception 'Only trainers can manage clients';
  end if;

  if not exists (
    select 1
    from public."trainerClients" tc
    where tc."trainerId" = v_trainer_id
      and tc."clientId" = p_client_id
      and tc.status = 'active'::link_status
  ) then
    raise exception 'Client is not linked to this trainer';
  end if;

  insert into public."trainerClientManagement" (
    "trainerId", "clientId", "clientStatus", "coachNotes", "tags", "checkInFrequency", "nextCheckInAt"
  )
  values (
    v_trainer_id,
    p_client_id,
    coalesce(p_client_status, 'active'::public.client_status),
    p_coach_notes,
    coalesce(p_tags, '{}'::text[]),
    coalesce(p_check_in_frequency, 'weekly'::public.checkin_frequency),
    p_next_check_in_at
  )
  on conflict ("trainerId", "clientId")
  do update set
    "clientStatus" = coalesce(excluded."clientStatus", public."trainerClientManagement"."clientStatus"),
    "coachNotes" = coalesce(excluded."coachNotes", public."trainerClientManagement"."coachNotes"),
    "tags" = coalesce(excluded."tags", public."trainerClientManagement"."tags"),
    "checkInFrequency" = coalesce(excluded."checkInFrequency", public."trainerClientManagement"."checkInFrequency"),
    "nextCheckInAt" = coalesce(excluded."nextCheckInAt", public."trainerClientManagement"."nextCheckInAt"),
    "updatedAt" = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.anvil_assign_program_to_client(
  p_client_id uuid,
  p_program_template_id uuid,
  p_start_date date,
  p_notes text default null
)
returns public."clientProgramAssignments"
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_trainer_id uuid;
  v_row public."clientProgramAssignments";
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

  if exists (
    select 1
    from public."clientProgramAssignments" cpa
    where cpa.clientid = p_client_id
      and cpa.trainerid = v_trainer_id
      and coalesce(cpa.status, 'active') = 'active'
  ) then
    raise exception 'Client already has an active program assignment';
  end if;

  insert into public."clientProgramAssignments"(
    trainerid, clientid, programtemplateid, startdate, status, notes, progress
  )
  values (
    v_trainer_id,
    p_client_id,
    p_program_template_id,
    p_start_date,
    'active',
    p_notes,
    jsonb_build_object('version',1,'completedDayKeys',jsonb_build_array(),'lastCompletedAt',null)
  )
  returning * into v_row;

  return v_row;
end;
$$;

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
        and cwa.trainerid = v_trainer_id
    ) then
      raise exception 'Workout already scheduled for this date';
    end if;
  end if;

  if p_overwrite_existing then
    delete from public."clientWorkoutAssignments" cwa
    where cwa.clientid = p_client_id
      and cwa.scheduledfor = p_scheduled_for
      and cwa.trainerid = v_trainer_id;
  end if;

  insert into public."clientWorkoutAssignments"(
    trainerid, clientid, workoutid, scheduledfor, status, source, programassignmentid, programdaykey
  )
  values (
    v_trainer_id, p_client_id, p_workout_id, p_scheduled_for, 'assigned', p_source, p_program_assignment_id, p_program_day_key
  )
  on conflict (clientid, workoutid, scheduledfor)
  where programassignmentid is null
  do update
    set updatedat = now(),
        trainerid = excluded.trainerid,
        source = excluded.source
  returning * into v_row;

  if v_row.id is not null then
    return v_row;
  end if;

  return v_row;
exception
  when unique_violation then
    -- Return existing assignment for idempotent UX.
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
  uuid, uuid, date, text, uuid, text
);

-- Ensure SECURITY DEFINER functions use safe search_path.
create or replace function public.get_my_program_assignments()
returns setof public."clientProgramAssignments"
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
  from public."clientProgramAssignments"
  where clientid = v_uid
  order by startdate desc, createdat desc;
end;
$$;

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
  order by scheduledfor asc, createdat asc;
end;
$$;

revoke all on function public.generate_program_workout_assignments(uuid, boolean) from public;
grant execute on function public.generate_program_workout_assignments(uuid, boolean) to authenticated;

revoke all on function public.anvil_upsert_trainer_client_management(
  uuid, client_status, text, text[], checkin_frequency, timestamptz
) from public;
grant execute on function public.anvil_upsert_trainer_client_management(
  uuid, client_status, text, text[], checkin_frequency, timestamptz
) to authenticated;

revoke all on function public.assign_client_workout_template(
  uuid, uuid, date, text, uuid, text, boolean
) from public;
grant execute on function public.assign_client_workout_template(
  uuid, uuid, date, text, uuid, text, boolean
) to authenticated;

-- -----------------------------------------------------------------------------
-- Phase 4 + 5: performance indexes and constraints for high-frequency queries
-- -----------------------------------------------------------------------------

create index if not exists idx_client_program_assignments_programtemplateid
  on public."clientProgramAssignments"(programtemplateid);
create index if not exists idx_client_program_assignments_trainer_client_status
  on public."clientProgramAssignments"(trainerid, clientid, status);
create index if not exists idx_client_workout_assignments_programassignmentid
  on public."clientWorkoutAssignments"(programassignmentid);
create index if not exists idx_client_workout_assignments_workoutid
  on public."clientWorkoutAssignments"(workoutid);
create index if not exists idx_client_workout_assignments_client_scheduledfor
  on public."clientWorkoutAssignments"(clientid, scheduledfor);
create index if not exists idx_client_workout_assignments_trainer_client_scheduledfor
  on public."clientWorkoutAssignments"(trainerid, clientid, scheduledfor);
create index if not exists idx_workout_sessions_assignmentid
  on public."workoutSessions"(assignmentid);
create index if not exists idx_workout_sessions_client_status_startedat
  on public."workoutSessions"(clientid, status, startedat desc);
create index if not exists idx_workout_set_logs_session_exercise_set
  on public."workoutSetLogs"(sessionid, exercisekey, setindex);
create index if not exists idx_trainer_client_management_clientid
  on public."trainerClientManagement"("clientId");
create index if not exists idx_trainer_clients_clientid
  on public."trainerClients"("clientId");
create index if not exists idx_trainer_invites_trainerid
  on public."trainerInvites"("trainerId");
create index if not exists idx_trainer_invites_redeemedby
  on public."trainerInvites"("redeemedBy");
create index if not exists idx_trainer_requests_clientid
  on public."trainerRequests"("clientId");
create index if not exists idx_workout_set_prescriptions_settypeid
  on public."workoutSetPrescriptions"("setTypeId");

