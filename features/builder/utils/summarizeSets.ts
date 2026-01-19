import type { ExerciseSet } from "../types";

function toNumOrNull(v: string) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

export function summarizeSets(sets: ExerciseSet[]) {
  const count = sets.length;

  const repsNums = sets
    .map((s) => toNumOrNull(s.reps))
    .filter((x): x is number => x !== null);

  const restNums = sets
    .map((s) => toNumOrNull(s.restSec))
    .filter((x): x is number => x !== null);

  const repsText =
    repsNums.length === 0
      ? "—"
      : repsNums.every((x) => x === repsNums[0])
      ? String(repsNums[0])
      : `${Math.min(...repsNums)}-${Math.max(...repsNums)}`;

  const restText =
    restNums.length === 0
      ? "—"
      : restNums.every((x) => x === restNums[0])
      ? `${restNums[0]}s`
      : `${Math.min(...restNums)}-${Math.max(...restNums)}s`;

  return {
    setsCount: count,
    repsText,
    restText,
  };
}
