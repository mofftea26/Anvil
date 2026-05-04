import type { TrainerClientRow } from "@/features/clients/components/trainer-clients/TrainerClientCard";
import type { ClientWorkoutAssignment } from "@/features/workouts/types";
import { scheduleTimeToMinutes } from "@/shared/utils/scheduleTime";

import { getInitials } from "@/features/linking/utils/coachFormatting";

export type TrainerTodaysRosterRow = {
  clientId: string;
  name: string;
  workoutTitle: string | null;
  avatarUrl: string | null;
  seed: string;
  initials: string | null;
  hasWorkout: boolean;
  scheduledTime: string | null;
  /** Unix ms for today's local scheduled start; 0 if no workout. */
  scheduledAtMs: number;
};

function scheduledLocalMs(ymd: string, timeHms: string | null): number {
  const mins = scheduleTimeToMinutes(timeHms);
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return 0;
  return new Date(y, (m ?? 1) - 1, d ?? 1, Math.floor(mins / 60), mins % 60, 0, 0).getTime();
}

/**
 * Builds trainer-facing “today’s roster” rows: workouts first, ordered by absolute
 * closeness to `now` (then upcoming over past on tie). Rest-day clients follow, A–Z.
 */
export function buildTrainerTodaysRosterRows(params: {
  activeRows: TrainerClientRow[];
  todayWorkoutByClientId: Record<string, ClientWorkoutAssignment>;
  workoutTitleById: Record<string, string>;
  todayYmd: string;
  now?: Date;
  unnamedClientLabel: string;
}): TrainerTodaysRosterRow[] {
  const now = params.now ?? new Date();
  const nowMs = now.getTime();

  const rows: TrainerTodaysRosterRow[] = params.activeRows.map((row) => {
    const todayWorkout = params.todayWorkoutByClientId[row.clientId] ?? null;
    const workoutTitle = todayWorkout
      ? params.workoutTitleById[todayWorkout.workoutTemplateId] ?? null
      : null;
    const first = row.client?.firstName ?? "";
    const last = row.client?.lastName ?? "";
    const fullName =
      `${first} ${last}`.trim() || row.client?.email || params.unnamedClientLabel;
    const scheduledTime = todayWorkout?.scheduledTime ?? null;
    const scheduledAtMs = todayWorkout
      ? scheduledLocalMs(todayWorkout.scheduledFor || params.todayYmd, scheduledTime)
      : 0;
    return {
      clientId: row.clientId,
      name: fullName,
      workoutTitle,
      avatarUrl: row.client?.avatarUrl ?? null,
      seed: row.client?.id ?? row.client?.email ?? row.clientId ?? row.id,
      initials: getInitials(first, last),
      hasWorkout: Boolean(todayWorkout),
      scheduledTime,
      scheduledAtMs,
    };
  });

  rows.sort((a, b) => {
    if (a.hasWorkout !== b.hasWorkout) return a.hasWorkout ? -1 : 1;
    if (!a.hasWorkout) return a.name.localeCompare(b.name);
    const da = Math.abs(a.scheduledAtMs - nowMs);
    const db = Math.abs(b.scheduledAtMs - nowMs);
    if (da !== db) return da - db;
    const fa = a.scheduledAtMs - nowMs;
    const fb = b.scheduledAtMs - nowMs;
    return fa - fb;
  });

  return rows;
}
