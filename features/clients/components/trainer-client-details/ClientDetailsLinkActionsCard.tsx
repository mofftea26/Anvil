import React from "react";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, Text, VStack } from "@/shared/ui";

type ClientDetailsLinkActionsCardProps = {
  isArchived: boolean;
  hasLink: boolean;
  linksLoading: boolean;
  archiveLoading: boolean;
  deleteLoading: boolean;
  onArchive: () => void | Promise<void>;
  onDelete: () => void;
};

export function ClientDetailsLinkActionsCard({
  isArchived,
  hasLink,
  linksLoading,
  archiveLoading,
  deleteLoading,
  onArchive,
  onDelete,
}: ClientDetailsLinkActionsCardProps) {
  const { t } = useAppTranslation();

  return (
    <Card>
      <VStack style={{ gap: 10 }}>
        <Text weight="bold">{t("linking.clientDetails.linkActions")}</Text>
        <Button
          isLoading={archiveLoading}
          height={40}
          onPress={() => void onArchive()}
        >
          {isArchived
            ? t("linking.clients.unarchive")
            : t("linking.clients.archive")}
        </Button>
        {isArchived ? (
          <Button
            variant="secondary"
            height={40}
            isLoading={deleteLoading}
            onPress={onDelete}
          >
            {t("linking.clients.deleteClient")}
          </Button>
        ) : null}
        {!hasLink && !linksLoading ? (
          <Text muted>{t("linking.clientDetails.notFound")}</Text>
        ) : null}
      </VStack>
    </Card>
  );
}
