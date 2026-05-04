export type CheckInStatus = "scheduled" | "completed" | "missed" | "cancelled";

export type TrainerCheckIn = {
  id: string;
  trainerId: string;
  clientId: string;
  scheduledFor: string;
  scheduledTime: string | null;
  sortOrder: number;
  status: CheckInStatus;
  notes: string | null;
  metricSummary: string | null;
  createdAt: string;
  updatedAt: string;
  clientFirstName: string | null;
  clientLastName: string | null;
  clientAvatarUrl: string | null;
};
