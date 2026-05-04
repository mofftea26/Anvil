import type { WorkoutState } from "@/features/builder/types/workoutState";

// Backend uses string statuses like "assigned" / "completed".
// For UI we accept known statuses + future ones safely.
export type AssignmentStatus = "assigned" | "completed" | "skipped" | "cancelled";
export type SessionStatus = "in_progress" | "completed" | "cancelled";

export type ClientWorkoutAssignment = {
  id: string;
  clientId: string;
  trainerId: string;
  workoutTemplateId: string;
  scheduledFor: string; // YYYY-MM-DD
  scheduledTime: string | null; // HH:mm:ss
  source: string | null;
  programAssignmentId?: string | null;
  status: AssignmentStatus | null;
  programDayKey?: string | null;
};

export type ClientProgramAssignmentStatus = "active" | "archived" | "completed" | string;

export type ClientProgramAssignmentProgressV1 = {
  // Backend progress currently guarantees at least this field.
  completedDayKeys: string[];
  // Optional metadata; keep best-effort.
  lastCompletedAt?: string | null;
};

export type ClientProgramAssignment = {
  id: string;
  trainerId: string;
  clientId: string;
  programTemplateId: string;
  startDate: string; // YYYY-MM-DD
  status: ClientProgramAssignmentStatus | null;
  notes: string | null;
  progress: ClientProgramAssignmentProgressV1 | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Per-day row returned by `anvil_get_program_progress(p_program_assignment_id)`.
 * Status tells the calendar grid how to color each cell.
 */
export type ProgramProgressDayStatus = "completed" | "pending" | "missed" | "rest";

export type ProgramProgressDay = {
  dayKey: string;
  weekIndex: number;
  dayIndex: number;
  scheduledFor: string; // YYYY-MM-DD
  isRest: boolean;
  workoutId: string | null;
  status: ProgramProgressDayStatus;
};

/** Single-row aggregate from `anvil_get_active_program_detail(p_assignment_id)`. */
export type ActiveProgramDetail = {
  assignmentId: string;
  startDate: string;
  status: string;
  notes: string | null;
  templateId: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  durationWeeks: number | null;
  state: unknown;
  totalDays: number;
  workoutDays: number;
  restDays: number;
  completedDays: number;
  pendingDays: number;
  missedDays: number;
  expectedEndDate: string | null;
};

export type WorkoutTemplate = {
  id: string;
  trainerId: string;
  title: string;
  state: WorkoutState;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutSession = {
  id: string;
  clientId: string;
  trainerId: string;
  workoutAssignmentId: string | null;
  workoutTemplateId: string;
  startedAt: string;
  finishedAt: string | null;
  durationSec: number | null;
  status: SessionStatus;
};

export type WorkoutSetLog = {
  id: string;
  sessionId: string;
  seriesBlockId: string | null;
  seriesExerciseId: string | null;
  setIndex: number;
  reps: number | null;
  weight: number | null;
  completed: boolean | null;
  createdAt: string;
};

export type WorkoutSetLogDraft = {
  sessionId: string;
  seriesBlockId: string | null;
  seriesExerciseId: string | null;
  setIndex: number;
  reps: number | null;
  weight: number | null;
  completed: boolean;
};

