export type UnitSystem = "metric" | "imperial";

export function kgToLb(kg: number): number {
  return kg * 2.2046226218;
}

export function lbToKg(lb: number): number {
  return lb / 2.2046226218;
}

export function cmToIn(cm: number): number {
  return cm / 2.54;
}

export function inToCm(inches: number): number {
  return inches * 2.54;
}

export function cmToFeetInches(cm: number): { ft: number; inches: number } {
  const totalIn = cmToIn(cm);
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn - ft * 12);
  return { ft, inches: inches === 12 ? 0 : inches };
}

export function feetInchesToCm(ft: number, inches: number): number {
  const totalIn = ft * 12 + inches;
  return inToCm(totalIn);
}

export function toNumberOrNull(v: string): number | null {
  const n = v.trim() ? Number(v.trim()) : null;
  if (n === null) return null;
  return Number.isFinite(n) ? n : null;
}

