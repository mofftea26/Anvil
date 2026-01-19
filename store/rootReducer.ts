import { combineReducers } from "@reduxjs/toolkit";
import { authReducer } from "../features/auth/store/authSlice";
import profileReducer from "../features/profile/store/profileSlice";
import { api } from "../shared/api/api";

export const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
  profile: profileReducer,
});
