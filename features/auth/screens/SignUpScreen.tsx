import { router } from "expo-router";

import { SignUpForm } from "@/features/auth/components/sign-up/SignUpForm";
import { useSignUpForm } from "@/features/auth/hooks/sign-up/useSignUpForm";
import { KeyboardScreen, useTheme } from "@/shared/ui";

export default function SignUpScreen() {
  const theme = useTheme();

  const { form, onSubmit, isBusy } = useSignUpForm({
    onSuccess: () =>
      router.replace({ pathname: "../forgot-password", params: { mode: "signup" } }),
  });

  return (
    <KeyboardScreen centerIfShort padding={theme.spacing.xl}>
      <SignUpForm form={form} onSubmit={onSubmit} isBusy={isBusy} />
    </KeyboardScreen>
  );
}
