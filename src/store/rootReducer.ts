import { combineReducers } from "@reduxjs/toolkit";
import { api } from "../shared/api/api";
import { authReducer } from "../features/auth/store/authSlice";
import profileReducer from "../features/profile/store/profileSlice";

export const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
  profile: profileReducer,
});
