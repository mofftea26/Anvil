import { supabase } from "@/shared/supabase/client";

import type {
  ClientWorkoutAssignment,
  ClientProgramAssignment,
  ClientProgramAssignmentProgressV1,
  WorkoutSession,
  WorkoutSetLog,
  WorkoutSetLogDraft,
  WorkoutTemplate,
} from "../types";

type RawClientWorkoutAssignmentRow = {
  id: string;
  clientid: string;
  trainerid: string;
  workouttemplateid: string;
  scheduledfor: string; // YYYY-MM-DD
  source: string | null;
  programassignmentid: string | null;
  programdaykey: string | null;
  status: string | null;
};

type RawClientProgramAssignmentRow = {
  id: string;
  clientid: string;
  trainerid: string;
  programtemplateid: string;
  startdate: string; // YYYY-MM-DD
  status: string | null;
  notes: string | null;
  progress: unknown | null;
  createdat: string;
  updatedat: string;
};

function toClientWorkoutAssignment(row: RawClientWorkoutAssignmentRow): ClientWorkoutAssignment {
  return {
    id: row.id,
    clientId: row.clientid,
    trainerId: row.trainerid,
    workoutTemplateId: row.workouttemplateid,
    scheduledFor: row.scheduledfor,
    source: row.source ?? null,
    programAssignmentId: row.programassignmentid ?? null,
    programDayKey: row.programdaykey ?? null,
    status: (row.status as any) ?? null,
  };
}

export async function listClientWorkoutAssignments(params: {
  clientId: string;
  startYmd: string;
  endYmd: string;
}): Promise<ClientWorkoutAssignment[]> {
  // Recommended read RPC (returns schedule for current authed client).
  const res = await supabase.rpc("get_my_workout_schedule", {
    p_from: params.startYmd,
    p_to: params.endYmd,
  });
  if (res.error) throw res.error;
  const rows = (res.data ?? []) as RawClientWorkoutAssignmentRow[];
  const filtered = params.clientId ? rows.filter((r) => r.clientid === params.clientId) : rows;
  return filtered.map(toClientWorkoutAssignment);
}

export async function fetchActiveClientProgramAssignment(params: {
  clientId: string;
}): Promise<
  | {
      id: string;
      clientId: string;
      trainerId: string;
      programTemplateId: string;
      startDate: string; // YYYY-MM-DD
      notes: string | null;
    }
  | null
> {
  const { data, error } = await supabase
    .from("clientProgramAssignments")
    .select("*")
    .eq("clientid", params.clientId)
    .eq("status", "active")
    .order("startdate", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const r = data as RawClientProgramAssignmentRow;
  return {
    id: r.id,
    clientId: r.clientid,
    trainerId: r.trainerid,
    programTemplateId: r.programtemplateid,
    startDate: r.startdate,
    notes: r.notes ?? null,
  };
}

function toProgressV1(x: unknown | null): ClientProgramAssignmentProgressV1 | null {
  if (!x || typeof x !== "object") return null;
  const v = x as any;
  const keys = Array.isArray(v.completedDayKeys)
    ? v.completedDayKeys.filter((k: any) => typeof k === "string")
    : [];
  return {
    completedDayKeys: keys,
    lastCompletedAt: typeof v.lastCompletedAt === "string" ? v.lastCompletedAt : null,
  };
}

function toClientProgramAssignment(row: RawClientProgramAssignmentRow): ClientProgramAssignment {
  return {
    id: row.id,
    trainerId: row.trainerid,
    clientId: row.clientid,
    programTemplateId: row.programtemplateid,
    startDate: row.startdate,
    status: row.status ?? null,
    notes: row.notes ?? null,
    progress: toProgressV1(row.progress),
    createdAt: row.createdat,
    updatedAt: row.updatedat,
  };
}

export async function listClientProgramAssignments(params: {
  clientId: string;
}): Promise<ClientProgramAssignment[]> {
  // Recommended read RPC (returns assignments for current authed client).
  const res = await supabase.rpc("get_my_program_assignments");
  if (res.error) throw res.error;
  const rows = (res.data ?? []) as RawClientProgramAssignmentRow[];
  // Safety: if caller passed a different clientId (shouldn't happen in UI), filter.
  const filtered = params.clientId ? rows.filter((r) => r.clientid === params.clientId) : rows;
  return filtered.map(toClientProgramAssignment);
}

export async function fetchClientProgramAssignmentById(params: {
  assignmentId: string;
}): Promise<ClientProgramAssignment | null> {
  const { data, error } = await supabase
    .from("clientProgramAssignments")
    .select("*")
    .eq("id", params.assignmentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toClientProgramAssignment(data as RawClientProgramAssignmentRow);
}

export async function markProgramDayComplete(params: {
  programAssignmentId: string;
  dayKey: string;
}): Promise<ClientProgramAssignment> {
  const res = await supabase.rpc("mark_program_day_complete", {
    p_program_assignment_id: params.programAssignmentId,
    p_day_key: params.dayKey,
  });
  if (res.error) throw res.error;
  // RPC returns updated row
  return toClientProgramAssignment(res.data as RawClientProgramAssignmentRow);
}

export async function unmarkProgramDayComplete(params: {
  programAssignmentId: string;
  dayKey: string;
}): Promise<ClientProgramAssignment> {
  const res = await supabase.rpc("unmark_program_day_complete", {
    p_program_assignment_id: params.programAssignmentId,
    p_day_key: params.dayKey,
  });
  if (res.error) throw res.error;
  return toClientProgramAssignment(res.data as RawClientProgramAssignmentRow);
}

export async function fetchProgramTemplateByIdPublic(params: {
  programTemplateId: string;
}): Promise<
  | {
      id: string;
      title: string;
      description: string | null;
      difficulty: string | null;
      durationWeeks: number | null;
      state: unknown | null;
    }
  | null
> {
  const { data, error } = await supabase
    .from("programTemplates")
    .select("id,title,description,difficulty,durationWeeks,state")
    .eq("id", params.programTemplateId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as any;
  return {
    id: String(r.id),
    title: String(r.title ?? "Program"),
    description: (r.description as string | null) ?? null,
    difficulty: (r.difficulty as string | null) ?? null,
    durationWeeks: (r.durationWeeks as number | null) ?? null,
    state: (r.state as unknown | null) ?? null,
  };
}

export async function listClientWorkoutAssignmentsForProgramAssignment(params: {
  clientId: string;
  programAssignmentId: string;
}): Promise<ClientWorkoutAssignment[]> {
  const { data, error } = await supabase
    .from("clientWorkoutAssignments")
    .select("*")
    .eq("clientid", params.clientId)
    .eq("programassignmentid", params.programAssignmentId)
    .order("scheduledfor", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as RawClientWorkoutAssignmentRow[]).map(toClientWorkoutAssignment);
}

export async function fetchClientWorkoutAssignmentById(
  assignmentId: string
): Promise<ClientWorkoutAssignment | null> {
  const { data, error } = await supabase
    .from("clientWorkoutAssignments")
    .select("*")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return toClientWorkoutAssignment(data as RawClientWorkoutAssignmentRow);
}

export async function fetchWorkoutTemplateById(
  workoutTemplateId: string
): Promise<WorkoutTemplate | null> {
  // Assign-workout RPC sends workouts.id as p_workout_id (see backend contract).
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutTemplateId)
    .maybeSingle();

  if (error) throw error;
  return (data as WorkoutTemplate | null) ?? null;
}

export async function listWorkoutSessions(params: {
  clientId: string;
  startIso?: string;
  endIso?: string;
  limit?: number;
}): Promise<WorkoutSession[]> {
  let q = supabase
    .from("workoutSessions")
    .select("*")
    .eq("clientId", params.clientId)
    .order("startedAt", { ascending: false });

  if (params.startIso) q = q.gte("startedAt", params.startIso);
  if (params.endIso) q = q.lt("startedAt", params.endIso);
  if (params.limit) q = q.limit(params.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data as WorkoutSession[]) ?? [];
}

export async function fetchWorkoutSessionById(
  sessionId: string
): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from("workoutSessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  return (data as WorkoutSession | null) ?? null;
}

export async function getOrCreateInProgressSession(params: {
  clientId: string;
  trainerId: string;
  workoutAssignmentId: string | null;
  workoutTemplateId: string;
}): Promise<{ session: WorkoutSession; resumed: boolean }> {
  if (params.workoutAssignmentId) {
    const { data, error } = await supabase
      .from("workoutSessions")
      .select("*")
      .eq("clientId", params.clientId)
      .eq("workoutAssignmentId", params.workoutAssignmentId)
      .eq("status", "in_progress")
      .order("startedAt", { ascending: false })
      .maybeSingle();

    if (error) throw error;
    if (data) return { session: data as WorkoutSession, resumed: true };
  }

  const { data: created, error: createError } = await supabase
    .from("workoutSessions")
    .insert({
      clientId: params.clientId,
      trainerId: params.trainerId,
      workoutAssignmentId: params.workoutAssignmentId,
      workoutTemplateId: params.workoutTemplateId,
      status: "in_progress",
      startedAt: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (createError) throw createError;
  return { session: created as WorkoutSession, resumed: false };
}

export async function listWorkoutSetLogs(sessionId: string): Promise<WorkoutSetLog[]> {
  const { data, error } = await supabase
    .from("workoutSetLogs")
    .select("*")
    .eq("sessionId", sessionId)
    .order("createdAt", { ascending: true });

  if (error) throw error;
  return (data as WorkoutSetLog[]) ?? [];
}

export async function upsertWorkoutSetLogs(
  drafts: WorkoutSetLogDraft[]
): Promise<void> {
  if (drafts.length === 0) return;

  const payload = drafts.map((d) => ({
    sessionId: d.sessionId,
    seriesBlockId: d.seriesBlockId,
    seriesExerciseId: d.seriesExerciseId,
    setIndex: d.setIndex,
    reps: d.reps,
    weight: d.weight,
    completed: d.completed,
  }));

  // Assumption: unique constraint on (sessionId, seriesExerciseId, setIndex)
  // TODO: If the backend uses a different uniqueness key, adjust onConflict.
  const { error } = await supabase
    .from("workoutSetLogs")
    .upsert(payload, {
      onConflict: "sessionId,seriesExerciseId,setIndex",
      ignoreDuplicates: false,
    });

  if (error) throw error;
}

export async function finishWorkoutSession(params: {
  sessionId: string;
  durationSec: number;
}): Promise<void> {
  const { error } = await supabase
    .from("workoutSessions")
    .update({
      status: "completed",
      finishedAt: new Date().toISOString(),
      durationSec: params.durationSec,
    })
    .eq("id", params.sessionId);

  if (error) throw error;
}

