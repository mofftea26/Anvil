// The schedule-time utilities now live in `@/shared/utils/scheduleTime` so
// that both the workouts schedule timeline and the new check-ins timeline can
// share the same time math. This file is kept as a thin re-export to avoid
// breaking existing imports across the workouts/clients/dashboard features.
export {
  DEFAULT_SCHEDULE_TIME,
  formatScheduleTimeLabel,
  minutesToScheduleTime,
  normalizeScheduleTime,
  scheduleTimeToMinutes,
} from "@/shared/utils/scheduleTime";
