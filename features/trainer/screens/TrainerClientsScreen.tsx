import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { useTrainerClients } from "@/features/trainer/hooks/useTrainerClients";
import {
  Button,
  Card,
  HStack,
  LoadingSpinner,
  StickyHeader,
  Text,
  VStack,
} from "@/shared/ui";

export default function TrainerClientsScreen() {
  const {
    t,
    theme,
    clientCards,
    isLoading,
    errorMessage,
    refreshing,
    onRefresh,
    onAddClient,
    onViewClient,
    onToggleArchive,
    isUpdatingStatus,
  } = useTrainerClients();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader
        title={t("linking.clients.title")}
        rightButton={{
          onPress: onAddClient,
          variant: "icon",
          icon: (
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={theme.colors.text}
            />
          ),
        }}
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {errorMessage ? (
          <Text color={theme.colors.danger}>{errorMessage}</Text>
        ) : null}

        {isLoading ? (
          <LoadingSpinner />
        ) : !clientCards.length ? (
          <Card>
            <VStack style={{ gap: theme.spacing.sm }}>
              <Text weight="bold">{t("linking.clients.empty")}</Text>
              <Button onPress={onAddClient}>
                {t("linking.clients.addClient")}
              </Button>
            </VStack>
          </Card>
        ) : (
          <VStack style={{ gap: theme.spacing.md }}>
            {clientCards.map((card) => (
              <Card key={card.id} padded={false} style={{ overflow: "hidden" }}>
                <View style={{ position: "relative" }}>
                  <LinearGradient
                    colors={[
                      "rgba(124,58,237,0.22)",
                      "rgba(56,189,248,0.10)",
                      "rgba(255,255,255,0.00)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />

                  <VStack style={{ gap: 12, padding: 14 }}>
                    <HStack align="center" justify="space-between">
                      <HStack align="center" gap={10} style={{ flex: 1 }}>
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            backgroundColor: card.avatar.bg,
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.14)",
                          }}
                        >
                          {card.avatar.imageUrl ? (
                            <Image
                              source={{ uri: card.avatar.imageUrl }}
                              style={{ width: "100%", height: "100%" }}
                              contentFit="cover"
                            />
                          ) : card.avatar.initials ? (
                            <Text
                              weight="bold"
                              style={{ color: "white", fontSize: 14 }}
                            >
                              {card.avatar.initials}
                            </Text>
                          ) : (
                            <Ionicons name="person" size={20} color="white" />
                          )}
                        </View>
                        <VStack style={{ flex: 1 }}>
                          <Text
                            weight="bold"
                            numberOfLines={1}
                            style={{ fontSize: 16 }}
                          >
                            {card.name}
                          </Text>
                        </VStack>
                      </HStack>

                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: card.statusPill.bg,
                          borderWidth: 1,
                          borderColor: card.statusPill.border,
                        }}
                      >
                        <Text
                          variant="caption"
                          style={{ color: card.statusPill.text }}
                        >
                          {card.statusPill.label}
                        </Text>
                      </View>
                    </HStack>

                    <View
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.10)",
                        borderRadius: 14,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                      }}
                    >
                      <HStack align="center" style={{ gap: 12 }}>
                        <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
                          <Text variant="caption" muted>
                            {t("profile.fields.target")}
                          </Text>
                          <Text numberOfLines={1} weight="semibold">
                            {card.targetText}
                          </Text>
                        </VStack>

                        <View
                          style={{
                            width: 1,
                            alignSelf: "stretch",
                            backgroundColor: "rgba(255,255,255,0.10)",
                          }}
                        />

                        <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
                          <Text variant="caption" muted>
                            {t("linking.clients.nextCheckIn")}
                          </Text>
                          <Text numberOfLines={1} weight="semibold">
                            {card.checkInText}
                          </Text>
                        </VStack>
                      </HStack>
                    </View>

                    <HStack gap={10}>
                      <Button
                        variant="secondary"
                        height={40}
                        fullWidth
                        style={{ flex: 1 }}
                        onPress={() => onViewClient(card.clientId)}
                      >
                        {t("linking.clients.viewClient")}
                      </Button>
                      <Button
                        height={40}
                        fullWidth
                        style={{ flex: 1 }}
                        isLoading={isUpdatingStatus}
                        onPress={() =>
                          void onToggleArchive(card.clientId, card.isArchived)
                        }
                      >
                        {card.isArchived
                          ? t("linking.clients.unarchive")
                          : t("linking.clients.archive")}
                      </Button>
                    </HStack>
                  </VStack>
                </View>
              </Card>
            ))}
          </VStack>
        )}
      </ScrollView>
    </View>
  );
}
