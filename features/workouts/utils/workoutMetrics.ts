import type { WorkoutSetLog } from "../types";

export function calculateTotalVolume(logs: WorkoutSetLog[]): number {
  // volume = sum(reps * weight) for completed sets where both are present
  let total = 0;
  for (const l of logs) {
    if (!l.completed) continue;
    if (typeof l.reps !== "number" || typeof l.weight !== "number") continue;
    if (!Number.isFinite(l.reps) || !Number.isFinite(l.weight)) continue;
    total += l.reps * l.weight;
  }
  return total;
}

export function formatDurationSeconds(sec: number | null | undefined): string {
  const s = Math.max(0, Math.floor(sec ?? 0));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

