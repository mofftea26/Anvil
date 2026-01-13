import * as ImagePicker from "expo-image-picker";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { useTheme } from "../theme";
import { Button } from "./Button";
import { Text } from "./Text";

type Props = {
  label: string;
  value: string;
  onChange: (uri: string) => void;
};

export function ImagePickerField({ label, value, onChange }: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });

    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    onChange(uri);
  };

  return (
    <View style={{ gap: 8 }}>
      <Text variant="caption" style={{ opacity: 0.9 }}>
        {label}
      </Text>

      {value ? (
        <Pressable
          onPress={pick}
          style={({ pressed }) => [
            styles.preview,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface2,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Image
            source={{ uri: value }}
            style={{ width: "100%", height: 160, borderRadius: 14 }}
            contentFit="cover"
          />
        </Pressable>
      ) : (
        <Button variant="secondary" onPress={pick} contentStyle={{ justifyContent: "space-between" }}>
          {t("common.chooseFile")}
        </Button>
      )}

      {value ? (
        <Button variant="secondary" onPress={pick}>
          {t("common.change")}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
  },
});

