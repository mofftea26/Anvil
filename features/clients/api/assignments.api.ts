import { supabase } from "@/shared/supabase/client";

import type { TrainerClientProgramAssignmentRow, ClientWorkoutAssignmentRow } from "../types/assignments";
import type { ClientWorkoutAssignment } from "@/features/workouts/types";
import type { DayWorkoutRef, ProgramDay, ProgramTemplateState } from "@/features/library/types/programTemplate";

export async function checkWorkoutExists(workoutId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", workoutId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

type RawWorkoutAssignmentRow = {
  id: string;
  trainerid: string;
  clientid: string;
  workouttemplateid: string;
  scheduledfor: string; // YYYY-MM-DD
  status: string | null;
  source: string | null;
  programassignmentid: string | null;
  programdaykey: string | null;
};

function toWorkoutAssignment(row: RawWorkoutAssignmentRow): ClientWorkoutAssignment {
  return {
    id: row.id,
    trainerId: row.trainerid,
    clientId: row.clientid,
    workoutTemplateId: row.workouttemplateid,
    scheduledFor: row.scheduledfor,
    status: (row.status as any) ?? null,
    source: row.source ?? null,
    programAssignmentId: row.programassignmentid ?? null,
    programDayKey: row.programdaykey ?? null,
  };
}

export async function assignWorkoutTemplateToClients(params: {
  trainerId: string;
  clientIds: string[];
  workoutTemplateId: string; // NOTE: this is a workouts.id now
  scheduledFor: string; // YYYY-MM-DD
  source?: string;
  programAssignmentId?: string | null;
  programDayKey?: string | null;
}): Promise<void> {
  if (!params.trainerId) throw new Error("Not authenticated");
  if (!params.clientIds.length) return;

  // New backend RPC expects workouts.id as p_workout_id.
  for (const clientId of params.clientIds) {
    const res = await supabase.rpc("assign_client_workout", {
      p_client_id: clientId,
      p_workout_id: params.workoutTemplateId,
      p_scheduled_for: params.scheduledFor,
      p_source: params.source ?? "manual",
      p_program_assignment_id: params.programAssignmentId ?? null,
      p_program_day_key: params.programDayKey ?? null,
    });
    console.log("[assignWorkoutTemplateToClients] rpc response", res);
    if (res.error) throw res.error;
  }
}

export async function listClientWorkoutAssignmentsForTrainer(params: {
  trainerId: string;
  clientId: string;
  startYmd: string;
  endYmd: string;
}): Promise<ClientWorkoutAssignmentRow[]> {
  const { data, error } = await supabase
    .from("clientWorkoutAssignments")
    .select("*")
    .eq("trainerid", params.trainerId)
    .eq("clientid", params.clientId)
    .gte("scheduledfor", params.startYmd)
    .lte("scheduledfor", params.endYmd)
    .order("scheduledfor", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as RawWorkoutAssignmentRow[]).map(toWorkoutAssignment);
}

export async function assignProgramTemplateToClients(params: {
  trainerId: string;
  clientIds: string[];
  programTemplateId: string;
  startDate: string; // YYYY-MM-DD
  notes?: string | null;
}): Promise<void> {
  if (!params.trainerId) throw new Error("Not authenticated");
  if (!params.clientIds.length) return;

  // Insert sequentially so the UI can handle 409 duplicates per-client.
  for (const clientId of params.clientIds) {
    await insertClientProgramAssignment({
      trainerId: params.trainerId,
      clientId,
      programTemplateId: params.programTemplateId,
      startDate: params.startDate,
      notes: params.notes ?? null,
    });
  }
}

export async function insertClientProgramAssignment(params: {
  trainerId: string;
  clientId: string;
  programTemplateId: string;
  startDate: string; // YYYY-MM-DD
  notes?: string | null;
}): Promise<TrainerClientProgramAssignmentRow> {
  const res = await supabase
    .from("clientProgramAssignments")
    .insert({
      trainerid: params.trainerId,
      clientid: params.clientId,
      programtemplateid: params.programTemplateId,
      startdate: params.startDate,
      status: "active",
      notes: params.notes ?? null,
    })
    .select("*")
    .single();
  console.log("[insertClientProgramAssignment] response", res);
  if (res.error) throw res.error;
  return res.data as unknown as TrainerClientProgramAssignmentRow;
}

export async function generateProgramWorkoutAssignments(params: {
  programAssignmentId: string;
  replaceExisting: boolean;
}): Promise<void> {
  const res = await supabase.rpc("generate_program_workout_assignments", {
    p_program_assignment_id: params.programAssignmentId,
    p_replace_existing: params.replaceExisting,
  });
  console.log("[generateProgramWorkoutAssignments] rpc response", res);
  if (res.error) throw res.error;
}

export async function fetchClientProgramAssignmentByUniqueKey(params: {
  clientId: string;
  programTemplateId: string;
  startDate: string; // YYYY-MM-DD
}): Promise<TrainerClientProgramAssignmentRow | null> {
  const res = await supabase
    .from("clientProgramAssignments")
    .select("*")
    .eq("clientid", params.clientId)
    .eq("programtemplateid", params.programTemplateId)
    .eq("startdate", params.startDate)
    .maybeSingle();
  console.log("[fetchClientProgramAssignmentByUniqueKey] response", res);
  if (res.error) throw res.error;
  return (res.data as unknown as TrainerClientProgramAssignmentRow | null) ?? null;
}

export async function reactivateClientProgramAssignment(params: { assignmentId: string }) {
  const res = await supabase.rpc("reactivate_client_program_assignment", {
    p_assignment_id: params.assignmentId,
  });
  console.log("[reactivateClientProgramAssignment] rpc response", res);
  if (res.error) throw res.error;
  return res.data;
}

export async function resetClientProgramAssignmentProgress(params: { assignmentId: string }) {
  const res = await supabase.rpc("reset_client_program_assignment_progress", {
    p_assignment_id: params.assignmentId,
  });
  console.log("[resetClientProgramAssignmentProgress] rpc response", res);
  if (res.error) throw res.error;
  return res.data;
}

export async function archiveClientProgramAssignment(params: { assignmentId: string }) {
  const res = await supabase.rpc("archive_client_program_assignment", {
    p_assignment_id: params.assignmentId,
  });
  console.log("[archiveClientProgramAssignment] rpc response", res);
  if (res.error) throw res.error;
  return res.data;
}

export async function updateClientProgramAssignmentStartDate(params: {
  assignmentId: string;
  startDate: string; // YYYY-MM-DD
}) {
  const res = await supabase.rpc("update_client_program_assignment_start_date", {
    p_assignment_id: params.assignmentId,
    p_new_start_date: params.startDate,
  });
  console.log("[updateClientProgramAssignmentStartDate] rpc response", res);
  if (res.error) throw res.error;
  // Regenerate schedule replacing existing.
  await generateProgramWorkoutAssignments({
    programAssignmentId: params.assignmentId,
    replaceExisting: true,
  });
  return res.data;
}

export async function listClientProgramAssignmentsForTrainer(params: {
  trainerId: string;
  clientId: string;
}): Promise<TrainerClientProgramAssignmentRow[]> {
  const { data, error } = await supabase
    .from("clientProgramAssignments")
    .select("*")
    .eq("trainerid", params.trainerId)
    .eq("clientid", params.clientId)
    .order("startdate", { ascending: false });

  if (error) throw error;
  return (data as unknown as TrainerClientProgramAssignmentRow[]) ?? [];
}

export async function listActiveProgramAssignmentsByClientIds(params: {
  trainerId: string;
  clientIds: string[];
}): Promise<Array<{ clientid: string; id: string; programtemplateid: string; startdate: string }>> {
  const ids = Array.from(new Set(params.clientIds.filter(Boolean)));
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("clientProgramAssignments")
    .select("id,clientid,programtemplateid,startdate,status")
    .eq("trainerid", params.trainerId)
    .in("clientid", ids)
    .eq("status", "active");

  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    clientid: r.clientid,
    programtemplateid: r.programtemplateid,
    startdate: r.startdate,
  }));
}

export async function fetchActiveProgramAssignmentForClient(params: {
  trainerId: string;
  clientId: string;
}): Promise<{ id: string; programtemplateid: string; startdate: string } | null> {
  const { data, error } = await supabase
    .from("clientProgramAssignments")
    .select("id,programtemplateid,startdate,status")
    .eq("trainerid", params.trainerId)
    .eq("clientid", params.clientId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as any;
  return { id: r.id, programtemplateid: r.programtemplateid, startdate: r.startdate };
}

export async function fetchWorkoutAssignmentForClientOnDate(params: {
  trainerId: string;
  clientId: string;
  ymd: string;
}): Promise<ClientWorkoutAssignment | null> {
  const { data, error } = await supabase
    .from("clientWorkoutAssignments")
    .select("*")
    .eq("trainerid", params.trainerId)
    .eq("clientid", params.clientId)
    .eq("scheduledfor", params.ymd)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toWorkoutAssignment(data as RawWorkoutAssignmentRow);
}

export async function updateClientWorkoutAssignmentDate(params: {
  assignmentId: string;
  scheduledFor: string; // YYYY-MM-DD
}): Promise<void> {
  const res = await supabase.rpc("update_workout_assignment_date", {
    p_assignment_id: params.assignmentId,
    p_scheduled_for: params.scheduledFor,
  });
  console.log("[updateClientWorkoutAssignmentDate] rpc response", res);
  if (res.error) throw res.error;
}

export async function deleteClientWorkoutAssignment(params: { assignmentId: string }): Promise<void> {
  const res = await supabase.rpc("unassign_workout_from_client", {
    p_assignment_id: params.assignmentId,
  });
  console.log("[deleteClientWorkoutAssignment] rpc response", res);
  if (res.error) throw res.error;
}

export async function listProgramAssignmentStatsByTemplateIds(params: {
  trainerId: string;
  programTemplateIds: string[];
}): Promise<Record<string, { doing: number; finished: number }>> {
  const ids = Array.from(new Set(params.programTemplateIds.filter(Boolean)));
  if (!ids.length) return {};

  const { data, error } = await supabase
    .from("clientProgramAssignments")
    .select("programtemplateid,status")
    .eq("trainerid", params.trainerId)
    .in("programtemplateid", ids);

  if (error) throw error;

  const out: Record<string, { doing: number; finished: number }> = {};
  for (const id of ids) out[id] = { doing: 0, finished: 0 };

  for (const row of (data ?? []) as Array<{ programtemplateid: string; status: string | null }>) {
    const pid = row.programtemplateid;
    if (!out[pid]) out[pid] = { doing: 0, finished: 0 };
    if (row.status === "completed") out[pid].finished += 1;
    else out[pid].doing += 1;
  }
  return out;
}

