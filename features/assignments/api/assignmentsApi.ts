import { supabase } from "@/shared/supabase/client";
import { setScheduleTimeOverride } from "@/shared/utils/scheduleTimeOverrides";

function isMissingScheduledTimeColumn(error: unknown): boolean {
  const msg = String((error as any)?.message ?? "");
  const code = String((error as any)?.code ?? "");
  return code === "42703" || (msg.toLowerCase().includes("scheduledtime") && msg.toLowerCase().includes("column"));
}

export type ClientProgramAssignmentRow = {
  id: string;
  trainerid: string;
  clientid: string;
  programtemplateid: string;
  startdate: string; // YYYY-MM-DD
  status: string | null;
  notes: string | null;
  progress: unknown | null;
};

export type ClientWorkoutAssignmentRow = {
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

export async function listTrainerClientProgramAssignments(params: {
  trainerId: string;
  clientId: string;
}): Promise<ClientProgramAssignmentRow[]> {
  const { data, error } = await supabase
    .from("clientProgramAssignments")
    .select("*")
    .eq("trainerid", params.trainerId)
    .eq("clientid", params.clientId)
    .order("startdate", { ascending: false });
  if (error) throw error;
  return (data as ClientProgramAssignmentRow[]) ?? [];
}

export async function listTrainerClientWorkoutAssignments(params: {
  trainerId: string;
  clientId: string;
  fromYmd: string;
  toYmd: string;
}): Promise<ClientWorkoutAssignmentRow[]> {
  let query = await supabase
    .from("clientWorkoutAssignments")
    .select("*")
    .eq("trainerid", params.trainerId)
    .eq("clientid", params.clientId)
    .gte("scheduledfor", params.fromYmd)
    .lte("scheduledfor", params.toYmd)
    .order("scheduledfor", { ascending: true })
    .order("scheduledtime", { ascending: true });
  if (query.error && isMissingScheduledTimeColumn(query.error)) {
    query = await supabase
      .from("clientWorkoutAssignments")
      .select("*")
      .eq("trainerid", params.trainerId)
      .eq("clientid", params.clientId)
      .gte("scheduledfor", params.fromYmd)
      .lte("scheduledfor", params.toYmd)
      .order("scheduledfor", { ascending: true });
  }
  if (query.error) throw query.error;
  return (query.data as ClientWorkoutAssignmentRow[]) ?? [];
}

export async function anvilAssignProgramToClient(params: {
  clientId: string;
  programTemplateId: string;
  startDate: string; // YYYY-MM-DD
  notes?: string | null;
}): Promise<ClientProgramAssignmentRow> {
  const res = await supabase.rpc("anvil_assign_program_to_client", {
    p_client_id: params.clientId,
    p_program_template_id: params.programTemplateId,
    p_start_date: params.startDate,
    p_notes: params.notes ?? null,
  });
  // Keep exactly one log in the app: program assignment response (for debugging).
  console.log("[anvilAssignProgramToClient] response", res);
  if (res.error) throw res.error;
  return res.data as ClientProgramAssignmentRow;
}

export async function generateProgramWorkoutAssignments(params: {
  programAssignmentId: string;
  replaceExisting?: boolean;
}): Promise<number> {
  const res = await supabase.rpc("generate_program_workout_assignments", {
    p_program_assignment_id: params.programAssignmentId,
    p_replace_existing: params.replaceExisting ?? false,
  });
  if (res.error) throw res.error;
  return Number(res.data ?? 0);
}

export async function reactivateClientProgramAssignment(params: {
  assignmentId: string;
}): Promise<ClientProgramAssignmentRow> {
  const res = await supabase.rpc("reactivate_client_program_assignment", {
    p_assignment_id: params.assignmentId,
  });
  if (res.error) throw res.error;
  return res.data as ClientProgramAssignmentRow;
}

export async function resetClientProgramAssignmentProgress(params: {
  assignmentId: string;
}): Promise<boolean> {
  const res = await supabase.rpc("reset_client_program_assignment_progress", {
    p_assignment_id: params.assignmentId,
  });
  if (res.error) throw res.error;
  return Boolean(res.data);
}

export async function unassignProgramFromClient(params: {
  assignmentId: string;
}): Promise<boolean> {
  const res = await supabase.rpc("unassign_program_from_client", {
    p_assignment_id: params.assignmentId,
  });
  if (res.error) throw res.error;
  return Boolean(res.data);
}

export async function updateProgramAssignmentStartDate(params: {
  assignmentId: string;
  startDate: string; // YYYY-MM-DD
}): Promise<ClientProgramAssignmentRow> {
  const res = await supabase.rpc("update_program_assignment_start_date", {
    p_assignment_id: params.assignmentId,
    p_start_date: params.startDate,
  });
  if (res.error) throw res.error;
  return res.data as ClientProgramAssignmentRow;
}

export async function assignClientWorkout(params: {
  clientId: string;
  workoutId: string;
  scheduledFor: string; // YYYY-MM-DD
  scheduledTime?: string | null; // HH:mm:ss
  overwriteExisting?: boolean;
}): Promise<ClientWorkoutAssignmentRow> {
  let res = await supabase.rpc("assign_client_workout_template", {
    p_client_id: params.clientId,
    p_workout_id: params.workoutId,
    p_scheduled_for: params.scheduledFor,
    p_scheduled_time: params.scheduledTime ?? null,
    p_source: "manual",
    p_overwrite_existing: params.overwriteExisting ?? false,
  });
  if (res.error && String(res.error.message ?? "").includes("p_scheduled_time")) {
    res = await supabase.rpc("assign_client_workout_template", {
      p_client_id: params.clientId,
      p_workout_id: params.workoutId,
      p_scheduled_for: params.scheduledFor,
      p_source: "manual",
      p_overwrite_existing: params.overwriteExisting ?? false,
    });
  }
  if (res.error) throw res.error;
  return res.data as ClientWorkoutAssignmentRow;
}

export async function listWorkoutAssignmentsForClientOnDate(params: {
  trainerId: string;
  clientId: string;
  ymd: string;
}): Promise<ClientWorkoutAssignmentRow[]> {
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
  return (query.data as ClientWorkoutAssignmentRow[]) ?? [];
}

export async function unassignWorkoutFromClient(params: {
  assignmentId: string;
}): Promise<boolean> {
  const res = await supabase.rpc("unassign_workout_from_client", {
    p_assignment_id: params.assignmentId,
  });
  if (res.error) throw res.error;
  return Boolean(res.data);
}

export async function updateWorkoutAssignmentDate(params: {
  assignmentId: string;
  scheduledFor: string; // YYYY-MM-DD
}): Promise<ClientWorkoutAssignmentRow> {
  const { data, error } = await supabase
    .from("clientWorkoutAssignments")
    .update({
      scheduledfor: params.scheduledFor,
      updatedat: new Date().toISOString(),
    })
    .eq("id", params.assignmentId)
    .select("*")
    .single();
  if (error) throw error;
  return data as ClientWorkoutAssignmentRow;
}

export async function updateWorkoutAssignmentSchedule(params: {
  assignmentId: string;
  scheduledFor: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm:ss
}): Promise<ClientWorkoutAssignmentRow> {
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
  return res.data as ClientWorkoutAssignmentRow;
}

export async function fetchProgramAssignmentByUniqueKey(params: {
  clientId: string;
  programTemplateId: string;
  startDate: string; // YYYY-MM-DD
}): Promise<ClientProgramAssignmentRow | null> {
  const { data, error } = await supabase
    .from("clientProgramAssignments")
    .select("*")
    .eq("clientid", params.clientId)
    .eq("programtemplateid", params.programTemplateId)
    .eq("startdate", params.startDate)
    .maybeSingle();
  if (error) throw error;
  return (data as ClientProgramAssignmentRow | null) ?? null;
}
