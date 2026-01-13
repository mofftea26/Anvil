import type { ClientProfile, UserRow } from "../types/profile";

export type UpdateMyUserRowInput = Partial<
  Pick<UserRow, "firstName" | "lastName" | "avatarUrl" | "role" | "roleConfirmed">
>;

export type UpsertClientProfileInput = Partial<
  Pick<
    ClientProfile,
    | "phone"
    | "nationality"
    | "gender"
    | "birthDate"
    | "heightCm"
    | "weightKg"
    | "target"
    | "activityLevel"
    | "unitSystem"
    | "notes"
  >
>;

