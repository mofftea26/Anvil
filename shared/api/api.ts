import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

export type ApiError = {
  message: string;
};

/**
 * Shared RTK Query API instance.
 * Feature modules should `injectEndpoints` from here to keep things modular.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<ApiError>(),
  tagTypes: [
    "User",
    "Profile",
    "Auth",
    "TrainerClients",
    "TrainerInvites",
    "TrainerRequests",
    "Coach",
  ],
  endpoints: () => ({}),
});
