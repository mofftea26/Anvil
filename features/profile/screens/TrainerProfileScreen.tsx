import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { RefreshControl, View } from "react-native";

import { TrainerBrandCard } from "@/features/profile/components/trainer-profile/TrainerBrandCard";
import { TrainerFormCard } from "@/features/profile/components/trainer-profile/TrainerFormCard";
import { useTrainerProfile } from "@/features/profile/hooks/trainer-profile/useTrainerProfile";
import { KeyboardScreen } from "@/shared/components/KeyboardScreen";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
    Button,
    ProfileAccountCard,
    StickyHeader,
    Text,
    useAppAlert,
    useStickyHeaderHeight,
    useTheme,
    VStack,
} from "@/shared/ui";

export default function TrainerProfileScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();

  const {
    me,
    auth,
    form,
    setForm,
    error,
    isLoading,
    refreshing,
    onRefresh,
    pickAndUploadAvatar,
    clearAvatar,
    isAvatarUploading,
    avatarProgress,
    clearingAvatar,
    pickAndUploadBrandLogo,
    isLogoUploading,
    logoProgress,
    saving,
    signingOut,
    saveError,
    onPressSave,
    onPressSignOut,
    hexToRgba,
  } = useTrainerProfile();

  const brandA = theme.colors.accent;
  const brandB = theme.colors.accent2;
  const headerHeight = useStickyHeaderHeight({ subtitle: true });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.sm,
      }}
    >
      <LinearGradient
        colors={[
          hexToRgba(brandA, 0.45),
          hexToRgba(brandB, 0.3),
          "rgba(0,0,0,0.00)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
      />

      <StickyHeader
        title={t("tabs.profile")}
        subtitle={t("trainer.profileSubtitle")}
        backgroundColor={theme.colors.background}
      />

      <KeyboardScreen
        bottomSpace={12}
        headerHeight={headerHeight}
        style={{ backgroundColor: "transparent" }}
        scrollStyle={{ backgroundColor: "transparent" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
      >
        <VStack style={{ gap: theme.spacing.lg }}>
          {error ? (
            <Text color={theme.colors.danger}>{error}</Text>
          ) : null}

          <ProfileAccountCard
            title={t("profile.sections.account")}
            firstName={form.firstName}
            lastName={form.lastName}
            email={me?.email ?? ""}
            avatarUrl={form.avatarUrl}
            seed={auth.userId || me?.email || "seed"}
            onPressAvatar={() => void pickAndUploadAvatar()}
            onPressClear={() =>
              alert.confirm({
                title: t("profile.actions.clearPhoto"),
                message: t("common.areYouSure"),
                confirmText: t("common.clear"),
                cancelText: t("common.cancel"),
                destructive: true,
                onConfirm: async () => {
                  await clearAvatar();
                },
              })
            }
            clearLabel={t("profile.actions.clearPhoto")}
            disabled={isAvatarUploading || clearingAvatar}
            isUploading={isAvatarUploading}
            uploadLabel={
              avatarProgress != null
                ? `Uploading ${avatarProgress}%`
                : "Uploading…"
            }
          />

          <TrainerFormCard form={form} setForm={setForm} />

          <TrainerBrandCard
            form={form}
            setForm={setForm}
            pickAndUploadBrandLogo={pickAndUploadBrandLogo}
            isLogoUploading={isLogoUploading}
            logoProgress={logoProgress}
          />

          {saveError ? (
            <Text color={theme.colors.danger}>{saveError}</Text>
          ) : null}

          <Button
            isLoading={saving || isLoading}
            onPress={onPressSave}
          >
            {t("common.save")}
          </Button>

          <Button
            variant="secondary"
            isLoading={signingOut}
            onPress={onPressSignOut}
          >
            {t("profile.actions.signOut")}
          </Button>
        </VStack>
      </KeyboardScreen>
    </View>
  );
}
