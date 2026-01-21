import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";

type UseResetPasswordFormOptions = { onSuccess?: () => void };

export function useResetPasswordForm(options?: UseResetPasswordFormOptions) {
  const { t } = useAppTranslation();
  const { isBusy, doUpdatePassword } = useAuthActions();

  const schema = z
    .object({
      newPassword: z.string().min(8, t("auth.errors.passwordMin")),
      confirmPassword: z.string().min(8, t("auth.errors.passwordMin")),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: t("auth.errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await doUpdatePassword(values.newPassword);
      options?.onSuccess?.();
    } catch {
      // Error already shown via toast in useAuthActions
    }
  });

  return { form, onSubmit, isBusy };
}
