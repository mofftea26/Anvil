export const DEFAULT_SCHEDULE_TIME = "08:00:00";

export function normalizeScheduleTime(value: string | null | undefined): string {
  if (!value) return DEFAULT_SCHEDULE_TIME;
  const raw = String(value).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return DEFAULT_SCHEDULE_TIME;
  const hh = Math.max(0, Math.min(23, Number(match[1] ?? 8)));
  const mm = Math.max(0, Math.min(59, Number(match[2] ?? 0)));
  const ss = Math.max(0, Math.min(59, Number(match[3] ?? 0)));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function scheduleTimeToMinutes(value: string | null | undefined): number {
  const normalized = normalizeScheduleTime(value);
  const [hh, mm] = normalized.split(":");
  return Number(hh) * 60 + Number(mm);
}

export function minutesToScheduleTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const hh = Math.floor(clamped / 60);
  const mm = clamped % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

export function formatScheduleTimeLabel(value: string | null | undefined): string {
  const normalized = normalizeScheduleTime(value);
  const [hhRaw, mmRaw] = normalized.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  const suffix = hh >= 12 ? "PM" : "AM";
  const displayHour = hh % 12 === 0 ? 12 : hh % 12;
  return `${displayHour}:${String(mm).padStart(2, "0")} ${suffix}`;
}
