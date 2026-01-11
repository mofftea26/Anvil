import { useCallback, useState } from "react";
import {
  sendPasswordReset,
  signInWithMagicLink,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
} from "../api/authApi";

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
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const wrap = useCallback(async (fn: () => Promise<void>) => {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await fn();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Unknown error");
      throw e;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const doSignInPassword = useCallback(
    async (email: string, password: string) =>
      wrap(() => signInWithPassword(email, password)),
    [wrap]
  );

  const doSignInMagic = useCallback(
    async (email: string) => wrap(() => signInWithMagicLink(email)),
    [wrap]
  );

  const doSignUp = useCallback(
    async (email: string, password: string) =>
      wrap(() => signUpWithPassword(email, password)),
    [wrap]
  );

  const doForgotPassword = useCallback(
    async (email: string) => wrap(() => sendPasswordReset(email)),
    [wrap]
  );

  const doUpdatePassword = useCallback(
    async (newPassword: string) => wrap(() => updatePassword(newPassword)),
    [wrap]
  );

  const doSignOut = useCallback(async () => wrap(() => signOut()), [wrap]);

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
