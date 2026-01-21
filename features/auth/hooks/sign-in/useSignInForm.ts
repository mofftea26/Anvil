import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";

export type SignInMode = "password" | "magic";

type UseSignInFormOptions = {
  onPasswordSuccess?: () => void;
  onMagicSuccess?: () => void;
};

export function useSignInForm(options?: UseSignInFormOptions) {
  const { t } = useAppTranslation();
  const { isBusy, doSignInPassword, doSignInMagic } = useAuthActions();
  const [mode, setMode] = useState<SignInMode>("password");

  const emailSchema = useMemo(
    () => z.string().email(t("auth.errors.invalidEmail")),
    [t]
  );

  const passwordSchema = useMemo(
    () =>
      z.object({
        email: emailSchema,
        password: z.string().min(8, t("auth.errors.passwordMin")),
      }),
    [emailSchema, t]
  );

  const magicSchema = useMemo(
    () =>
      z.object({
        email: emailSchema,
      }),
    [emailSchema]
  );

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const magicForm = useForm<z.infer<typeof magicSchema>>({
    resolver: zodResolver(magicSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async (values) => {
    try {
      await doSignInPassword(values.email.trim(), values.password);
      options?.onPasswordSuccess?.();
    } catch {
      // Error already shown via toast in useAuthActions
    }
  });

  const onMagicSubmit = magicForm.handleSubmit(async (values) => {
    try {
      await doSignInMagic(values.email.trim());
      options?.onMagicSuccess?.();
    } catch {
      // Error already shown via toast in useAuthActions
    }
  });

  const switchMode = (next: SignInMode) => {
    if (next === mode) return;
    setMode(next);
  };

  return {
    mode,
    switchMode,
    passwordForm,
    magicForm,
    onPasswordSubmit,
    onMagicSubmit,
    isBusy,
  };
}
