import { supabase } from "@/shared/supabase/client";

import type { ActiveProgramDetail, ProgramProgressDay, ProgramProgressDayStatus } from "../types";

type RawProgramProgressRow = {
  daykey: string;
  weekindex: number;
  dayindex: number;
  scheduledfor: string;
  isrest: boolean;
  workoutid: string | null;
  status: string;
};

type RawActiveProgramDetailRow = {
  assignmentid: string;
  startdate: string;
  status: string;
  notes: string | null;
  templateid: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  durationweeks: number | null;
  state: unknown;
  totaldays: number;
  workoutdays: number;
  restdays: number;
  completeddays: number;
  pendingdays: number;
  misseddays: number;
  expectedenddate: string | null;
};

function mapDayStatus(raw: string): ProgramProgressDayStatus {
  if (raw === "completed" || raw === "pending" || raw === "missed" || raw === "rest") {
    return raw;
  }
  return "pending";
}

export function mapProgramProgressRow(row: RawProgramProgressRow): ProgramProgressDay {
  return {
    dayKey: row.daykey,
    weekIndex: row.weekindex,
    dayIndex: row.dayindex,
    scheduledFor: row.scheduledfor,
    isRest: row.isrest,
    workoutId: row.workoutid,
    status: mapDayStatus(row.status),
  };
}

export function mapActiveProgramDetailRow(row: RawActiveProgramDetailRow): ActiveProgramDetail {
  return {
    assignmentId: row.assignmentid,
    startDate: row.startdate,
    status: row.status,
    notes: row.notes,
    templateId: row.templateid,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    durationWeeks: row.durationweeks,
    state: row.state,
    totalDays: row.totaldays,
    workoutDays: row.workoutdays,
    restDays: row.restdays,
    completedDays: row.completeddays,
    pendingDays: row.pendingdays,
    missedDays: row.misseddays,
    expectedEndDate: row.expectedenddate,
  };
}

export async function fetchProgramProgressDays(
  programAssignmentId: string
): Promise<ProgramProgressDay[]> {
  const res = await supabase.rpc("anvil_get_program_progress", {
    p_program_assignment_id: programAssignmentId,
  });
  if (res.error) throw res.error;
  const rows = (res.data ?? []) as RawProgramProgressRow[];
  return rows.map(mapProgramProgressRow);
}

export async function fetchActiveProgramDetail(
  programAssignmentId: string
): Promise<ActiveProgramDetail> {
  const res = await supabase.rpc("anvil_get_active_program_detail", {
    p_assignment_id: programAssignmentId,
  });
  if (res.error) throw res.error;
  const rows = res.data as RawActiveProgramDetailRow[] | null;
  const row = rows?.[0];
  if (!row) throw new Error("Program detail not found");
  return mapActiveProgramDetailRow(row);
}
