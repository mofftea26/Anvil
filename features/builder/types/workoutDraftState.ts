import { WorkoutSeries } from "../types";

export type WorkoutDraftState = {
  version: 1;
  series: WorkoutSeries[];
};
