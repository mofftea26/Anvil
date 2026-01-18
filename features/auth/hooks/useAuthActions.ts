import { useCallback, useMemo, useState } from "react";
import {
  useSendPasswordResetMutation,
  useSignInWithMagicLinkMutation,
  useSignInWithPasswordMutation,
  useSignOutMutation,
  useSignUpWithPasswordMutation,
  useUpdatePasswordMutation,
} from "../api/authApiSlice";

type Result = {
  isBusy: boolean;
  errorMessage: string | null;
  clearError: () => void;

  doSignInPassword: (email: string, password: string) => Promise<void>;
  doSignInMagic: (email: string) => Promise<void>;
  doSignUp: (email: string, password: string) => Promise<void>;
  doForgotPassword: (email: string) => Promise<void>;
  doUpdatePassword: (newPassword: string) => Promise<void>;
  doSignOut: () => Promise<void>;
};

export function useAuthActions(): Result {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signInPassword, signInPasswordState] = useSignInWithPasswordMutation();
  const [signInMagic, signInMagicState] = useSignInWithMagicLinkMutation();
  const [signUp, signUpState] = useSignUpWithPasswordMutation();
  const [forgotPassword, forgotPasswordState] = useSendPasswordResetMutation();
  const [updatePw, updatePwState] = useUpdatePasswordMutation();
  const [signOut, signOutState] = useSignOutMutation();

  const isBusy = useMemo(
    () =>
      signInPasswordState.isLoading ||
      signInMagicState.isLoading ||
      signUpState.isLoading ||
      forgotPasswordState.isLoading ||
      updatePwState.isLoading ||
      signOutState.isLoading,
    [
      forgotPasswordState.isLoading,
      signInMagicState.isLoading,
      signInPasswordState.isLoading,
      signOutState.isLoading,
      signUpState.isLoading,
      updatePwState.isLoading,
    ]
  );

  const clearError = useCallback(() => setErrorMessage(null), []);

  const wrap = useCallback(async (fn: () => Promise<void>) => {
    setErrorMessage(null);
    try {
      await fn();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Unknown error");
      throw e;
    }
  }, []);

  const doSignInPassword = useCallback(
    async (email: string, password: string) =>
      wrap(() => signInPassword({ email, password }).unwrap()),
    [signInPassword, wrap]
  );

  const doSignInMagic = useCallback(
    async (email: string) => wrap(() => signInMagic({ email }).unwrap()),
    [signInMagic, wrap]
  );

  const doSignUp = useCallback(
    async (email: string, password: string) =>
      wrap(() => signUp({ email, password }).unwrap()),
    [signUp, wrap]
  );

  const doForgotPassword = useCallback(
    async (email: string) => wrap(() => forgotPassword({ email }).unwrap()),
    [forgotPassword, wrap]
  );

  const doUpdatePassword = useCallback(
    async (newPassword: string) => wrap(() => updatePw({ newPassword }).unwrap()),
    [updatePw, wrap]
  );

  const doSignOut = useCallback(async () => wrap(() => signOut().unwrap()), [signOut, wrap]);

  return {
    isBusy,
    errorMessage,
    clearError,
    doSignInPassword,
    doSignInMagic,
    doSignUp,
    doForgotPassword,
    doUpdatePassword,
    doSignOut,
  };
}
