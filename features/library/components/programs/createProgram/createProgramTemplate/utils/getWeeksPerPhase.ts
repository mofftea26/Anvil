/** Split total weeks across phases (first phases get +1 when remainder). */
export function getWeeksPerPhase(
  totalWeeks: number,
  phaseCount: number
): number[] {
  const count = Math.max(1, Math.min(phaseCount, totalWeeks));
  const base = Math.floor(totalWeeks / count);
  const remainder = totalWeeks % count;
  return Array.from(
    { length: count },
    (_, i) => base + (i < remainder ? 1 : 0)
  );
}
