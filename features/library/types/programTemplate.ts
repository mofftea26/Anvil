/**
 * Program template difficulty (matches DB enum anvil_program_difficulty).
 */
export type ProgramDifficulty = "beginner" | "intermediate" | "advanced";

/**
 * Workout reference in a day (state.weeks[].days[].workouts).
 * title is optional for display when resolved from workouts list.
 */
export type DayWorkout = {
  workoutId: string;
  source?: string;
  title?: string;
};

/**
 * Single day in a week (dayIndex 1–7).
 */
export type DayState = {
  dayIndex: number;
  workouts: DayWorkout[];
};

/**
 * Single week (weekIndex 1-based).
 */
export type WeekState = {
  weekIndex: number;
  days: DayState[];
};

/**
 * Program template state (jsonb). Versioned; durationWeeks controls weeks length.
 */
export type ProgramTemplateState = {
  version: 1;
  weeks: WeekState[];
};

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

export const STATE_VERSION = 1;
