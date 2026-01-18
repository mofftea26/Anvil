import i18n from "../../../shared/i18n/i18n";

export function mapLinkingError(message: string | null | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (!m) return i18n.t("auth.errors.generic");

  if (m.includes("invalid invite code")) return i18n.t("linking.errors.invalidInviteCode");
  if (m.includes("expired")) return i18n.t("linking.errors.inviteExpired");
  if (m.includes("not redeemable")) return i18n.t("linking.errors.inviteNotRedeemable");
  if (m.includes("only trainers")) return i18n.t("linking.errors.onlyTrainers");
  if (m.includes("role cannot be changed")) return i18n.t("linking.errors.roleLocked");

  return message ?? i18n.t("auth.errors.generic");
}

