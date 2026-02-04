import type { ProgramDifficulty } from "@/features/library/types/programTemplate";

/**
 * App-wide difficulty colors: rich, distinctive palette (not pale).
 * Beginner = teal, Intermediate = amber, Advanced = deep plum.
 */
export const DIFFICULTY_COLORS: Record<
  ProgramDifficulty,
  { main: string; bg: string; border: string; textOnMain: string }
> = {
  beginner: {
    main: "#0d9488", // teal-600
    bg: "rgba(13, 148, 136, 0.28)",
    border: "rgba(13, 148, 136, 0.6)",
    textOnMain: "#ffffff",
  },
  intermediate: {
    main: "#d97706", // amber-600
    bg: "rgba(217, 119, 6, 0.28)",
    border: "rgba(217, 119, 6, 0.6)",
    textOnMain: "#ffffff",
  },
  advanced: {
    main: "#7c3aed", // violet-600
    bg: "rgba(124, 58, 237, 0.28)",
    border: "rgba(124, 58, 237, 0.6)",
    textOnMain: "#ffffff",
  },
};

/**
 * App-wide difficulty icons (Icon name): SignalLow02, SignalMedium02, SignalFull02.
 */
export const DIFFICULTY_ICONS: Record<ProgramDifficulty, string> = {
  beginner: "signal-low",
  intermediate: "signal-medium",
  advanced: "signal-full",
};

export function getDifficultyColors(
  difficulty: ProgramDifficulty
): (typeof DIFFICULTY_COLORS)[ProgramDifficulty] {
  return DIFFICULTY_COLORS[difficulty];
}
