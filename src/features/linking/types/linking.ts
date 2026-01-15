export type LinkStatus = "active" | "archived";

export type TrainerClientLink = {
  id: string;
  trainerId: string;
  clientId: string;
  status: LinkStatus;
  createdAt?: string;
};

export type TrainerClientManagement = {
  trainerId: string;
  clientId: string;
  clientStatus: "active" | "paused" | "inactive";
  clientRelationshipStatus?: "active" | "paused" | null;
  clientPauseReason?: string | null;
  coachNotes: string | null;
  checkInFrequency: "weekly" | "biweekly" | "monthly" | "custom";
  nextCheckInAt: string | null;
  lastCheckInAt: string | null;
  updatedAt: string;
};

export type TrainerInviteStatus = "pending" | "redeemed" | "expired" | "revoked";

export type TrainerInvite = {
  id: string;
  trainerId: string;
  code: string;
  targetEmail: string | null;
  status: TrainerInviteStatus;
  expiresAt: string | null;
  redeemedBy: string | null;
  redeemedAt: string | null;
  createdAt?: string;
};

export type TrainerRequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export type TrainerRequest = {
  id: string;
  clientId: string;
  trainerEmail: string;
  message: string | null;
  status: TrainerRequestStatus;
  createdAt?: string;
  resolvedAt?: string | null;
};

