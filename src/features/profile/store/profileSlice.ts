import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ClientProfile, TrainerProfile, UserRow } from "../types/profile";
import type { UnitSystem } from "../utils/units";

type ProfileState = {
  me: UserRow | null;
  clientProfile: ClientProfile | null;
  trainerProfile: TrainerProfile | null;
  unitSystem: UnitSystem;
};

const initialState: ProfileState = {
  me: null,
  clientProfile: null,
  trainerProfile: null,
  unitSystem: "metric",
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
      const us = action.payload?.unitSystem;
      if (us === "metric" || us === "imperial") state.unitSystem = us;
    },
    setTrainerProfile(state, action: PayloadAction<TrainerProfile | null>) {
      state.trainerProfile = action.payload;
    },
    setUnitSystem(state, action: PayloadAction<UnitSystem>) {
      state.unitSystem = action.payload;
    },
    resetProfile() {
      return initialState;
    },
  },
});

export const profileActions = profileSlice.actions;
export default profileSlice.reducer;
