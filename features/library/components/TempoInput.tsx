import { Input, Text, useAppAlert, useTheme } from "@/src/shared/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type TempoValue = {
  eccentric: string;
  pauseBottom: string;
  concentric: string;
  pauseTop: string;
};

function parseTempo(value?: string): TempoValue {
  const parts = (value ?? "").split("/").map((x) => x.trim());
  return {
    eccentric: parts[0] ?? "",
    pauseBottom: parts[1] ?? "",
    concentric: parts[2] ?? "",
    pauseTop: parts[3] ?? "",
  };
}

function serializeTempo(v: TempoValue) {
  return `${v.eccentric || ""}/${v.pauseBottom || ""}/${v.concentric || ""}/${v.pauseTop || ""}`;
}

export function TempoInput({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (nextTempo: string) => void;
}) {
  const theme = useTheme();
  const alert = useAppAlert();

  const parsed = useMemo(() => parseTempo(value ?? ""), [value]);

  const styles = useMemo(
    () =>
      createStyles({
        border: theme.colors.border,
        text: theme.colors.text,
        textMuted: theme.colors.textMuted,
        surface2: theme.colors.surface2,
      }),
    [theme.colors]
  );

  const showInfo = () => {
    alert.show({
      title: "Tempo",
      message:
        "Tempo is written as:\n\nEccentric / Pause / Concentric / Pause\n\nExample: 3/1/1/0\n• 3s down\n• 1s hold\n• 1s up\n• 0s hold",
      buttons: [{ text: "Got it", variant: "primary" }],
    });
  };

  const setField = (key: keyof TempoValue, next: string) => {
    const nextTempo = serializeTempo({ ...parsed, [key]: next.replace(/[^0-9]/g, "") });
    onChange(nextTempo);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Ionicons name="speedometer" size={16} color={theme.colors.textMuted} />
        <Text style={styles.label}>Tempo</Text>
      </View>

      <View style={styles.row}>
        <Input
          label="Eccentric (s)"
          value={parsed.eccentric}
          onChangeText={(v) => setField("eccentric", v)}
          keyboardType="number-pad"
          placeholder="3"
          style={styles.cell}
        />
        <Text style={styles.sep}>/</Text>
        <Input
          label="Pause Bottom (s)"
          value={parsed.pauseBottom}
          onChangeText={(v) => setField("pauseBottom", v)}
          keyboardType="number-pad"
          placeholder="1"
          style={styles.cell}
        />
        <Text style={styles.sep}>/</Text>
        <Input
          label="Concentric (s)"
          value={parsed.concentric}
          onChangeText={(v) => setField("concentric", v)}
          keyboardType="number-pad"
          placeholder="1"
          style={styles.cell}
        />
        <Text style={styles.sep}>/</Text>
        <Input
          label="Pause Top (s)"
          value={parsed.pauseTop}
          onChangeText={(v) => setField("pauseTop", v)}
          keyboardType="number-pad"
          placeholder="0"
          style={styles.cell}

        />

        <Pressable onPress={showInfo} style={styles.infoBtn}>
          <Ionicons name="information-circle" size={18} color={theme.colors.accent2} />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(c: {
  border: string;
  text: string;
  textMuted: string;
  surface2: string;
}) {
  return StyleSheet.create({
    wrap: {
      marginTop: 10,
      gap: 8,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    label: {
      fontSize: 13,
      color: c.textMuted,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    cell: {
      width: 44,
      height: 38,
      borderRadius: 10,
      paddingHorizontal: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.surface2,
      borderWidth: 1,
      borderColor: c.border,
    },
    cellText: {
      textAlign: "center",
      fontSize: 14,
    },
    sep: {
      color: c.textMuted,
      fontSize: 14,
      marginHorizontal: 1,
    },
    infoBtn: {
      marginLeft: 6,
      padding: 6,
    },
  });
}
