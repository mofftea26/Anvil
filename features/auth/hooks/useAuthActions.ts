import { appToast } from "@/shared/ui";
import { useCallback, useMemo } from "react";
import {
    useSendPasswordResetMutation,
    useSignInWithMagicLinkMutation,
    useSignInWithPasswordMutation,
    useSignOutMutation,
    useSignUpWithPasswordMutation,
    useUpdatePasswordMutation,
} from "../api/authApiSlice";

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e != null && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Unknown error";
}

type Result = {
  isBusy: boolean;

  doSignInPassword: (email: string, password: string) => Promise<void>;
  doSignInMagic: (email: string) => Promise<void>;
  doSignUp: (email: string, password: string) => Promise<void>;
  doForgotPassword: (email: string) => Promise<void>;
  doUpdatePassword: (newPassword: string) => Promise<void>;
  doSignOut: () => Promise<void>;
};

export function useAuthActions(): Result {
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

  const wrap = useCallback(async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      appToast.error(getErrorMessage(e));
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
    doSignInPassword,
    doSignInMagic,
    doSignUp,
    doForgotPassword,
    doUpdatePassword,
    doSignOut,
  };
}
