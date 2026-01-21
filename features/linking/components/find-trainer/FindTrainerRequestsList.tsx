import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, Divider, HStack, LoadingSpinner, Text, VStack } from "@/shared/ui";

type Request = { id: string; trainerEmail: string; message?: string | null; status: string };

type FindTrainerRequestsListProps = {
  requests: Request[];
  isLoading: boolean;
};

export function FindTrainerRequestsList({
  requests,
  isLoading,
}: FindTrainerRequestsListProps) {
  const { t } = useAppTranslation();

  return (
    <Card>
      <VStack style={{ gap: 10 }}>
        <Text weight="bold">{t("linking.requests.title")}</Text>
        <Divider opacity={0.6} />

        {isLoading ? <LoadingSpinner /> : null}

        {!isLoading && (!requests?.length || requests.length === 0) ? (
          <Text muted>{t("linking.requests.empty")}</Text>
        ) : (
          <VStack style={{ gap: 10 }}>
            {requests?.map((r) => (
              <Card key={r.id} background="surface2">
                <VStack style={{ gap: 6 }}>
                  <HStack align="center" justify="space-between">
                    <Text weight="bold">{r.trainerEmail}</Text>
                    <Text muted>{r.status}</Text>
                  </HStack>
                  {r.message ? <Text muted>{r.message}</Text> : null}
                </VStack>
              </Card>
            ))}
          </VStack>
        )}
      </VStack>
    </Card>
  );
}
