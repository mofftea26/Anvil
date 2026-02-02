/**
 * Program template difficulty (matches DB enum anvil_program_difficulty).
 */
export type ProgramDifficulty = "beginner" | "intermediate" | "advanced";

/** Workout ref for a day: from workouts table or inline. */
export type DayWorkoutRef =
  | { source: "workoutsTable"; workoutId: string }
  | { source: "inline"; inlineWorkoutId: string }
  | null;

/** Single day in a week (new state shape). Multiple workouts per day supported via workouts[]. */
export type ProgramDay = {
  id: string;
  order: number;
  label: string;
  type: "workout" | "rest";
  /** @deprecated Use workouts[]; kept for backward compat. */
  workoutRef: DayWorkoutRef;
  /** Workouts assigned to this day (order preserved). Empty = rest day. */
  workouts: DayWorkoutRef[];
  notes: string | null;
};

/** Week in a phase. */
export type ProgramWeek = {
  index: number;
  label: string;
  days: ProgramDay[];
};

/** Phase groups weeks. */
export type ProgramPhase = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  durationWeeks: number;
  weeks: ProgramWeek[];
};

/** Inline workout (no DB id yet). */
export type InlineWorkout = {
  id: string;
  title: string;
  state: unknown;
};

/** Workout library in state: linked IDs + inline workouts. */
export type WorkoutLibrary = {
  linkedWorkoutIds: string[];
  inlineWorkouts: InlineWorkout[];
};

/** Optional UI state. */
export type ProgramTemplateUI = {
  selectedPhaseId: string | null;
  selectedWeekIndex: number;
  selectedDayId: string | null;
};

/**
 * Program template state (jsonb) – the only allowed shape.
 * jsonStateVersion: 1
 */
export type ProgramTemplateStateV1 = {
  jsonStateVersion: 1;
  difficulty: ProgramDifficulty;
  durationWeeks: number;
  phases: ProgramPhase[];
  workoutLibrary: WorkoutLibrary;
  ui?: ProgramTemplateUI;
};

/** Program template state (current version only). */
export type ProgramTemplateState = ProgramTemplateStateV1;

/**
 * Row from public.programTemplates (published-only in app).
 */
export type ProgramTemplate = {
  id: string;
  ownerTrainerId: string;
  status: string;
  title: string;
  description: string | null;
  durationWeeks: number | null;
  difficulty: ProgramDifficulty;
  state: ProgramTemplateState;
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string | null;
  isArchived: boolean;
};

export const PROGRAM_DIFFICULTIES: ProgramDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

export const JSON_STATE_VERSION = 1;
export const DEFAULT_PHASE_ID = "phase_default";
