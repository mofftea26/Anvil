import { combineReducers } from "@reduxjs/toolkit";
import { authReducer } from "../features/auth/store/authSlice";
import profileReducer from "../features/profile/store/profileSlice";

export const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
});
