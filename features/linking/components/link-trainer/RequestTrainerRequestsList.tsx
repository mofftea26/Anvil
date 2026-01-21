import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, Divider, HStack, Text, VStack } from "@/shared/ui";

type Request = {
  id: string;
  trainerEmail: string;
  message?: string | null;
  status: string;
};

type RequestTrainerRequestsListProps = {
  requests: Request[];
  onCancel: (requestId: string) => void;
};

export function RequestTrainerRequestsList({
  requests,
  onCancel,
}: RequestTrainerRequestsListProps) {
  const { t } = useAppTranslation();

  if (!requests?.length) return null;

  return (
    <VStack style={{ gap: 10 }}>
      <Text weight="bold">{t("linking.requests.title")}</Text>
      {requests.map((r) => (
        <Card key={r.id}>
          <VStack style={{ gap: 10 }}>
            <HStack align="center" justify="space-between">
              <Text weight="bold">{r.trainerEmail}</Text>
              <Text muted>{r.status}</Text>
            </HStack>
            {r.message ? <Text muted>{r.message}</Text> : null}
            {r.status === "pending" ? (
              <>
                <Divider opacity={0.6} />
                <Button variant="secondary" onPress={() => onCancel(r.id)}>
                  {t("linking.requests.cancel")}
                </Button>
              </>
            ) : null}
          </VStack>
        </Card>
      ))}
    </VStack>
  );
}
