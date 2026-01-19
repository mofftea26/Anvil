export type UserRole = "trainer" | "client";

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export type AuthState = {
  status: AuthStatus;
  userId: string | null;
  accessToken: string | null;
  role: UserRole | null;
  errorMessage: string | null;
};
