// The body of this component now lives in `@/shared/ui/timeline/TimelineBoard`
// so the same visualization can power both the workouts schedule and the new
// trainer check-ins timeline. The old name is kept as a thin re-export to
// avoid touching the existing consumers (`ClientScheduleScreen`,
// `TrainerClientScheduleTab`).
import { TimelineBoard } from "@/shared/ui/timeline/TimelineBoard";

export type {
  TimelineBoardProps,
  TimelineDay,
  TimelineItem,
} from "@/shared/ui/timeline/TimelineBoard";

export const ScheduleTimelineBoard = TimelineBoard;
