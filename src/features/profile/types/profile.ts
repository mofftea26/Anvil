export type UserRole = "trainer" | "client";

export type UserRow = {
  id: string;
  email: string | null;
  role: UserRole;
  roleConfirmed: boolean;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientProfile = {
  userId: string;
  phone: string | null;
  nationality: string | null;
  gender: string | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  target: string | null;
  activityLevel: string | null;
  unitSystem: string | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TrainerProfile = {
  userId: string; // frontend canonical
  phone: string | null;
  brandName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  bio: string | null;
  certifications: string | null;
  instagram: string | null;
  website: string | null;
  createdAt?: string;
  updatedAt?: string;
};
