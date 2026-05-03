import { supabase } from "@/shared/supabase/client";
import { getScheduleTimeOverrides, setScheduleTimeOverride } from "@/shared/utils/scheduleTimeOverrides";

import type { TrainerClientProgramAssignmentRow, ClientWorkoutAssignmentRow } from "../types/assignments";
import type { ClientWorkoutAssignment } from "@/features/workouts/types";

function isMissingScheduledTimeColumn(error: unknown): boolean {
  const msg = String((error as any)?.message ?? "");
  const code = String((error as any)?.code ?? "");
  return code === "42703" || (msg.toLowerCase().includes("scheduledtime") && msg.toLowerCase().includes("column"));
}

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
  workoutid: string;
  scheduledfor: string; // YYYY-MM-DD
  scheduledtime: string | null; // HH:mm:ss
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
    workoutTemplateId: row.workoutid,
    scheduledFor: row.scheduledfor,
    scheduledTime: row.scheduledtime ?? null,
    status: (row.status as any) ?? null,
    source: row.source ?? null,
    programAssignmentId: row.programassignmentid ?? null,
    programDayKey: row.programdaykey ?? null,
  };
}

export async function assignWorkoutToClients(params: {
  trainerId: string;
  clientIds: string[];
  workoutId: string; // workouts.id
  scheduledFor: string; // YYYY-MM-DD
  scheduledTime?: string | null; // HH:mm:ss
  source?: string;
  programAssignmentId?: string | null;
  programDayKey?: string | null;
  overwriteExisting?: boolean;
}): Promise<void> {
  if (!params.trainerId) throw new Error("Not authenticated");
  if (!params.clientIds.length) return;

  // Use single RPC per-client (backend handles duplicates by returning existing row).
  for (const clientId of params.clientIds) {
    let res = await supabase.rpc("assign_client_workout_template", {
      p_client_id: clientId,
      p_workout_id: params.workoutId,
      p_scheduled_for: params.scheduledFor,
      p_scheduled_time: params.scheduledTime ?? null,
      p_source: params.source ?? "manual",
      p_overwrite_existing: params.overwriteExisting ?? false,
    });
    if (res.error && String(res.error.message ?? "").includes("p_scheduled_time")) {
      res = await supabase.rpc("assign_client_workout_template", {
        p_client_id: clientId,
        p_workout_id: params.workoutId,
        p_scheduled_for: params.scheduledFor,
        p_source: params.source ?? "manual",
        p_overwrite_existing: params.overwriteExisting ?? false,
      });
    }
    if (res.error) throw res.error;
  }
}

export async function listClientWorkoutAssignmentsForTrainer(params: {
  trainerId: string;
  clientId: string;
  startYmd: string;
  endYmd: string;
}): Promise<ClientWorkoutAssignmentRow[]> {
  let query = await supabase
    .from("clientWorkoutAssignments")
    .select("*")
    .eq("trainerid", params.trainerId)
    .eq("clientid", params.clientId)
    .gte("scheduledfor", params.startYmd)
    .lte("scheduledfor", params.endYmd)
    .order("scheduledfor", { ascending: true })
    .order("scheduledtime", { ascending: true });
  if (query.error && isMissingScheduledTimeColumn(query.error)) {
    query = await supabase
      .from("clientWorkoutAssignments")
      .select("*")
      .eq("trainerid", params.trainerId)
      .eq("clientid", params.clientId)
      .gte("scheduledfor", params.startYmd)
      .lte("scheduledfor", params.endYmd)
      .order("scheduledfor", { ascending: true });
  }
  if (query.error) throw query.error;
  const mapped = ((query.data ?? []) as RawWorkoutAssignmentRow[])
    .map(toWorkoutAssignment)
    .sort((a, b) => String(a.scheduledTime ?? "").localeCompare(String(b.scheduledTime ?? "")));
  const missingIds = mapped.filter((x) => !x.scheduledTime).map((x) => x.id);
  if (!missingIds.length) return mapped;
  const overrides = await getScheduleTimeOverrides(missingIds);
  return mapped.map((row) =>
    row.scheduledTime ? row : { ...row, scheduledTime: overrides[row.id] ?? row.scheduledTime }
  );
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
  const res = await supabase.rpc("anvil_assign_program_to_client", {
    p_client_id: params.clientId,
    p_program_template_id: params.programTemplateId,
    p_start_date: params.startDate,
    p_notes: params.notes ?? null,
  });
  if (res.error) throw res.error;
  return res.data as unknown as TrainerClientProgramAssignmentRow;
}

export async function generateProgramWorkoutAssignments(params: {
  programAssignmentId: string;
  replaceExisting?: boolean;
}): Promise<void> {
  const res = await supabase.rpc("generate_program_workout_assignments", {
    p_program_assignment_id: params.programAssignmentId,
    p_replace_existing: params.replaceExisting ?? false,
  });
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
  if (res.error) throw res.error;
  return (res.data as unknown as TrainerClientProgramAssignmentRow | null) ?? null;
}

export async function reactivateClientProgramAssignment(params: { assignmentId: string }) {
  const res = await supabase.rpc("reactivate_client_program_assignment", {
    p_assignment_id: params.assignmentId,
  });
  if (res.error) throw res.error;
  return res.data;
}

export async function resetClientProgramAssignmentProgress(params: { assignmentId: string }) {
  const res = await supabase.rpc("reset_client_program_assignment_progress", {
    p_assignment_id: params.assignmentId,
  });
  if (res.error) throw res.error;
  return res.data;
}

export async function archiveClientProgramAssignment(params: { assignmentId: string }) {
  const res = await supabase.rpc("unassign_program_from_client", {
    p_assignment_id: params.assignmentId,
  });
  if (res.error) throw res.error;
  return res.data;
}

export async function updateClientProgramAssignmentStartDate(params: {
  assignmentId: string;
  startDate: string; // YYYY-MM-DD
}) {
  const res = await supabase.rpc("update_program_assignment_start_date", {
    p_assignment_id: params.assignmentId,
    p_start_date: params.startDate,
  });
  if (res.error) throw res.error;
  // Regenerate schedule.
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
}): Promise<{ clientid: string; id: string; programtemplateid: string; startdate: string }[]> {
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
  const rows = await listWorkoutAssignmentsForClientOnDate(params);
  return rows[0] ?? null;
}

export async function listWorkoutAssignmentsForClientOnDate(params: {
  trainerId: string;
  clientId: string;
  ymd: string;
}): Promise<ClientWorkoutAssignment[]> {
  let query = await supabase
    .from("clientWorkoutAssignments")
    .select("*")
    .eq("trainerid", params.trainerId)
    .eq("clientid", params.clientId)
    .eq("scheduledfor", params.ymd)
    .order("scheduledtime", { ascending: true })
    .order("createdat", { ascending: true });
  if (query.error && isMissingScheduledTimeColumn(query.error)) {
    query = await supabase
      .from("clientWorkoutAssignments")
      .select("*")
      .eq("trainerid", params.trainerId)
      .eq("clientid", params.clientId)
      .eq("scheduledfor", params.ymd)
      .order("createdat", { ascending: true });
  }
  if (query.error) throw query.error;
  const mapped = ((query.data ?? []) as RawWorkoutAssignmentRow[]).map(toWorkoutAssignment);
  const missingIds = mapped.filter((x) => !x.scheduledTime).map((x) => x.id);
  if (!missingIds.length) return mapped;
  const overrides = await getScheduleTimeOverrides(missingIds);
  return mapped.map((row) =>
    row.scheduledTime ? row : { ...row, scheduledTime: overrides[row.id] ?? row.scheduledTime }
  );
}

export async function updateClientWorkoutAssignmentDate(params: {
  assignmentId: string;
  scheduledFor: string; // YYYY-MM-DD
}): Promise<void> {
  const { error } = await supabase
    .from("clientWorkoutAssignments")
    .update({
      scheduledfor: params.scheduledFor,
      updatedat: new Date().toISOString(),
    })
    .eq("id", params.assignmentId);
  if (error) throw error;
}

export async function updateClientWorkoutAssignmentSchedule(params: {
  assignmentId: string;
  scheduledFor: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm:ss
}): Promise<ClientWorkoutAssignment> {
  let res = await supabase
    .from("clientWorkoutAssignments")
    .update({
      scheduledfor: params.scheduledFor,
      scheduledtime: params.scheduledTime,
      updatedat: new Date().toISOString(),
    })
    .eq("id", params.assignmentId)
    .select("*")
    .single();
  if (res.error && isMissingScheduledTimeColumn(res.error)) {
    res = await supabase
      .from("clientWorkoutAssignments")
      .update({
        scheduledfor: params.scheduledFor,
        updatedat: new Date().toISOString(),
      })
      .eq("id", params.assignmentId)
      .select("*")
      .single();
    if (!res.error) {
      await setScheduleTimeOverride(params.assignmentId, params.scheduledTime);
    }
  }
  if (res.error) throw res.error;
  const out = toWorkoutAssignment(res.data as RawWorkoutAssignmentRow);
  return { ...out, scheduledTime: out.scheduledTime ?? params.scheduledTime };
}

export async function deleteClientWorkoutAssignment(params: { assignmentId: string }): Promise<void> {
  const res = await supabase.rpc("unassign_workout_from_client", {
    p_assignment_id: params.assignmentId,
  });
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

  for (const row of (data ?? []) as { programtemplateid: string; status: string | null }[]) {
    const pid = row.programtemplateid;
    if (!out[pid]) out[pid] = { doing: 0, finished: 0 };
    if (row.status === "completed") out[pid].finished += 1;
    else out[pid].doing += 1;
  }
  return out;
}

