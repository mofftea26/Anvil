import { router } from "expo-router";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Icon, Text, useTheme } from "@/shared/ui";

type Props =
  | {
      variant: "normal";
      title: string;
      onChangeTitle: (v: string) => void;
      onBlurTitle: () => void;
      onOpenMenu: () => void;
    }
  | { variant: "loading" }
  | { variant: "error"; message?: string | null };

export function ProgramTemplateEditorHeader(props: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  if (props.variant === "loading") {
    return (
      <View
        style={[
          styles.headerBar,
          { paddingTop: 10, backgroundColor: theme.colors.background },
        ]}
      >
        <Button
          variant="icon"
          height={36}
          onPress={() => router.back()}
          left={
            <Icon name="chevron-back" size={22} color={theme.colors.text} />
          }
        />
        <Text
          style={[
            styles.headerTitlePlaceholder,
            { color: theme.colors.textMuted },
          ]}
        >
          …
        </Text>
        <View style={{ width: 36 }} />
      </View>
    );
  }

  if (props.variant === "error") {
    return (
      <View
        style={[
          styles.headerBar,
          { paddingTop: 10, backgroundColor: theme.colors.background },
        ]}
      >
        <Button
          variant="icon"
          height={36}
          onPress={() => router.back()}
          left={
            <Icon name="chevron-back" size={22} color={theme.colors.text} />
          }
        />
        <Text
          style={[styles.headerTitlePlaceholder, { color: theme.colors.text }]}
        >
          {t("library.programs", "Program")}
        </Text>
        <View style={{ width: 36 }} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.headerBar,
        { paddingTop: 10, backgroundColor: theme.colors.background },
      ]}
    >
      <Button
        variant="icon"
        height={40}
        onPress={() => router.back()}
        left={<Icon name="chevron-back" size={24} color={theme.colors.text} />}
      />
      <TextInput
        value={props.title}
        onChangeText={props.onChangeTitle}
        onBlur={props.onBlurTitle}
        placeholder={t(
          "library.createProgram.titlePlaceholder",
          "Program name"
        )}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.headerTitleInput, { color: theme.colors.text }]}
        maxLength={100}
      />
      <Button
        variant="icon"
        height={40}
        onPress={props.onOpenMenu}
        left={<Icon name="cog" size={22} color={theme.colors.text} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingBottom: 14,
  },
  headerTitleInput: {
    flex: 1,
    fontSize: 19,
    fontWeight: "600",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  headerTitlePlaceholder: {
    flex: 1,
    fontSize: 19,
    fontWeight: "600",
    paddingVertical: 10,
  },
});
