import React, { useEffect, useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, Text, useTheme, VStack } from "@/shared/ui";

import { ClientProgramAssignmentCard } from "../components/ClientProgramAssignmentCard";
import { useClientProgramAssignments } from "../hooks/useClientProgramAssignments";
import { useProgramTemplatesPublicMap } from "../hooks/useProgramTemplatesPublicMap";

function ListSkeleton() {
  const theme = useTheme();
  return (
    <VStack style={{ gap: 12 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 148,
            borderRadius: 18,
            backgroundColor: theme.colors.surface2,
            opacity: 0.6,
          }}
        />
      ))}
    </VStack>
  );
}

export function ClientMyProgramScreen() {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const clientId = useAppSelector((s) => s.auth.userId ?? "");

  const q = useClientProgramAssignments({ clientId });

  useEffect(() => {
    q.showErrorToast();
  }, [q.error, q.showErrorToast]);

  const programTemplateIds = useMemo(
    () => q.items.map((x) => x.programTemplateId),
    [q.items]
  );
  const { templatesById } = useProgramTemplatesPublicMap(programTemplateIds);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}
      refreshControl={
        <RefreshControl
          refreshing={q.refreshing}
          onRefresh={() => void q.onRefresh()}
          tintColor={theme.colors.text}
        />
      }
    >
      {q.loading ? (
        <ListSkeleton />
      ) : q.items.length === 0 ? (
        <Card background="surface2" style={styles.empty}>
          <Text weight="bold" style={{ fontSize: 16 }}>
            {t("client.program.noneTitle", "No programs yet")}
          </Text>
          <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 }}>
            {t("client.program.noneSubtitle", "When your trainer assigns a program, it will show up here.")}
          </Text>
        </Card>
      ) : (
        <VStack style={{ gap: 16 }}>
          <VStack style={{ gap: 12 }}>
            {q.active.map((a) => (
              <ClientProgramAssignmentCard
                key={a.id}
                assignment={a}
                template={templatesById[a.programTemplateId] ?? null}
                onPressSchedule={() =>
                  router.push(`/(client)/workouts/program-assignment/${a.id}` as any)
                }
              />
            ))}
          </VStack>

          {q.archived.length ? (
            <VStack style={{ gap: 12 }}>
              <Text
                weight="semibold"
                style={{
                  color: theme.colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  fontSize: 11,
                }}
              >
                {t("common.archived", "Archived")}
              </Text>
              {q.archived.map((a) => (
                <ClientProgramAssignmentCard
                  key={a.id}
                  assignment={a}
                  template={templatesById[a.programTemplateId] ?? null}
                  onPressSchedule={() =>
                    router.push(`/(client)/workouts/program-assignment/${a.id}` as any)
                  }
                />
              ))}
            </VStack>
          ) : null}
        </VStack>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 28 },
  empty: {
    borderRadius: 18,
    padding: 16,
  },
});

