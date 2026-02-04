import React from "react";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, Divider, HStack, Text, VStack } from "@/shared/ui";
import { formatSlugToLabel } from "@/shared/utils/formatSlugToLabel";

type ClientDetailsBasicInfoCardProps = {
  profile:
    | {
        phone?: string | null;
        nationality?: string | null;
        gender?: string | null;
        birthDate?: string | null;
        target?: string | null;
        activityLevel?: string | null;
        unitSystem?: string | null;
        notes?: string | null;
      }
    | null
    | undefined;
};

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack align="center" justify="space-between">
      <Text muted>{label}</Text>
      <Text style={{ maxWidth: "60%", textAlign: "right" }}>{value}</Text>
    </HStack>
  );
}

export function ClientDetailsBasicInfoCard({
  profile,
}: ClientDetailsBasicInfoCardProps) {
  const { t } = useAppTranslation();

  return (
    <Card>
      <VStack style={{ gap: 12 }}>
        <Text weight="bold">{t("linking.clientDetails.basicInfo")}</Text>
        <Divider opacity={0.6} />
        <FieldRow
          label={t("profile.fields.phone")}
          value={profile?.phone ?? "—"}
        />
        <FieldRow
          label={t("profile.fields.nationality")}
          value={profile?.nationality ?? "—"}
        />
        <FieldRow
          label={t("profile.fields.gender")}
          value={profile?.gender ?? "—"}
        />
        <FieldRow
          label={t("profile.fields.birthDate")}
          value={profile?.birthDate ?? "—"}
        />
        <FieldRow
          label={t("profile.fields.target")}
          value={
            profile?.target && profile.target.trim()
              ? formatSlugToLabel(profile.target)
              : t("linking.clients.noTarget")
          }
        />
        <FieldRow
          label={t("profile.fields.activityLevel")}
          value={profile?.activityLevel ?? "—"}
        />
        <FieldRow
          label={t("profile.fields.unitSystem")}
          value={profile?.unitSystem ?? "—"}
        />
        <FieldRow
          label={t("profile.fields.notes")}
          value={profile?.notes ?? "—"}
        />
      </VStack>
    </Card>
  );
}
