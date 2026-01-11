import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, UserRole } from "../types/auth";

const initialState: AuthState = {
  status: "idle",
  userId: null,
  accessToken: null,
  role: null,
  errorMessage: null,
};

type SetSessionPayload = {
  userId: string;
  accessToken: string;
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading(state) {
      state.status = "loading";
      state.errorMessage = null;
    },
    setUnauthenticated(state) {
      state.status = "unauthenticated";
      state.userId = null;
      state.accessToken = null;
      state.role = null;
      state.errorMessage = null;
    },
    setAuthenticated(state, action: PayloadAction<SetSessionPayload>) {
      state.status = "authenticated";
      state.userId = action.payload.userId;
      state.accessToken = action.payload.accessToken;
      state.errorMessage = null;
    },
    setRole(state, action: PayloadAction<UserRole>) {
      state.role = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.errorMessage = action.payload;
    },
    resetAuth() {
      return initialState;
    },
  },
});

export const authActions = authSlice.actions;
export const authReducer = authSlice.reducer;
