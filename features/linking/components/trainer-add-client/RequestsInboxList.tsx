import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Button,
  Card,
  Divider,
  HStack,
  LoadingSpinner,
  Text,
  VStack,
} from "@/shared/ui";

type Request = {
  id: string;
  clientId: string;
  message?: string | null;
  status: string;
};

type RequestsInboxListProps = {
  requests: Request[];
  isLoading: boolean;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
};

export function RequestsInboxList({
  requests,
  isLoading,
  onAccept,
  onDecline,
}: RequestsInboxListProps) {
  const { t } = useAppTranslation();

  return (
    <VStack style={{ gap: 10 }}>
      <Text weight="bold">{t("linking.requests.title")}</Text>

      {isLoading ? <LoadingSpinner /> : null}

      {!isLoading &&
      (!requests?.length || requests.length === 0) ? (
        <Card>
          <Text muted>{t("linking.requests.empty")}</Text>
        </Card>
      ) : (
        <VStack style={{ gap: 10 }}>
          {requests?.map((r) => (
            <Card key={r.id}>
              <VStack style={{ gap: 10 }}>
                <Text weight="bold">{r.clientId}</Text>
                {r.message ? <Text muted>{r.message}</Text> : null}
                <Divider opacity={0.6} />
                <HStack gap={10}>
                  <Button
                    fullWidth
                    style={{ flex: 1 }}
                    onPress={() => onAccept(r.id)}
                  >
                    {t("linking.requests.accept")}
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    style={{ flex: 1 }}
                    onPress={() => onDecline(r.id)}
                  >
                    {t("linking.requests.decline")}
                  </Button>
                </HStack>
              </VStack>
            </Card>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
