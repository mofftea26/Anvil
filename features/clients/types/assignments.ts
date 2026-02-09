import type { ClientProgramAssignment, ClientWorkoutAssignment } from "@/features/workouts/types";

export type TrainerClientProgramAssignmentRow = {
  id: string;
  clientid: string;
  trainerid: string;
  programtemplateid: string;
  startdate: string; // YYYY-MM-DD
  status: string | null;
  notes: string | null;
  progress: ClientProgramAssignment["progress"];
  createdat: string;
  updatedat: string;
};

export type ClientWorkoutAssignmentRow = ClientWorkoutAssignment;

