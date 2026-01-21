import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";

type UseSignUpFormOptions = { onSuccess?: () => void };

export function useSignUpForm(options?: UseSignUpFormOptions) {
  const { t } = useAppTranslation();
  const { isBusy, doSignUp } = useAuthActions();

  const schema = z
    .object({
      email: z.string().email(t("auth.errors.invalidEmail")),
      password: z.string().min(8, t("auth.errors.passwordMin")),
      confirmPassword: z.string().min(8, t("auth.errors.passwordMin")),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t("auth.errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await doSignUp(values.email.trim(), values.password);
      options?.onSuccess?.();
    } catch {
      // Error already shown via toast in useAuthActions
    }
  });

  return { form, onSubmit, isBusy };
}
