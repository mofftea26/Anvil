import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ClientProfile, TrainerProfile, UserRow } from "../types/profile";

type ProfileState = {
  me: UserRow | null;
  clientProfile: ClientProfile | null;
  trainerProfile: TrainerProfile | null;
};

const initialState: ProfileState = {
  me: null,
  clientProfile: null,
  trainerProfile: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setMe(state, action: PayloadAction<UserRow | null>) {
      state.me = action.payload;
    },
    setClientProfile(state, action: PayloadAction<ClientProfile | null>) {
      state.clientProfile = action.payload;
    },
    setTrainerProfile(state, action: PayloadAction<TrainerProfile | null>) {
      state.trainerProfile = action.payload;
    },
    resetProfile() {
      return initialState;
    },
  },
});

export const profileActions = profileSlice.actions;
export default profileSlice.reducer;
