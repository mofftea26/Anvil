import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";

type UseForgotPasswordFormOptions = { onSuccess?: () => void };

export function useForgotPasswordForm(options?: UseForgotPasswordFormOptions) {
  const { t } = useAppTranslation();
  const { isBusy, doForgotPassword } = useAuthActions();

  const schema = z.object({
    email: z.string().email(t("auth.errors.invalidEmail")),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await doForgotPassword(values.email.trim());
      options?.onSuccess?.();
    } catch {
      // Error already shown via toast in useAuthActions
    }
  });

  return { form, onSubmit, isBusy };
}
