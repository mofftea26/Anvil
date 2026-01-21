import { Ionicons } from "@expo/vector-icons";
import {
  AsYouType,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { countries } from "@/shared/constants/countries";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Button,
  Card,
  Text,
  useTheme,
} from "@/shared/ui";

export type PhoneInputProps = {
  label: string;
  value?: string;
  onChangeText?: (e164: string) => void;
  error?: string;
  placeholder?: string;
  containerStyle?: ViewStyle;
  defaultCountry?: CountryCode;
};

const DEFAULT_COUNTRY: CountryCode = "US";

function getCountryOptions(): { value: string; label: string }[] {
  return countries
    .map((c) => {
      try {
        const dial = getCountryCallingCode(c.code as CountryCode);
        return { value: c.code, label: `+${dial} ${c.name}` };
      } catch {
        return null;
      }
    })
    .filter((o): o is { value: string; label: string } => o != null);
}

export function PhoneInput({
  label,
  value = "",
  onChangeText,
  error,
  placeholder,
  containerStyle,
  defaultCountry = DEFAULT_COUNTRY,
}: PhoneInputProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const countryOptions = useMemo(getCountryOptions, []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [country, setCountry] = useState<CountryCode>(() => {
    if (!value) return defaultCountry;
    const p = parsePhoneNumberFromString(value, defaultCountry);
    return (p?.country ?? defaultCountry) as CountryCode;
  });

  const [nationalDigits, setNationalDigits] = useState(() => {
    if (!value) return "";
    const p = parsePhoneNumberFromString(value, defaultCountry);
    return p?.nationalNumber ?? value.replace(/\D/g, "").slice(0, 15);
  });

  const displayValue = useMemo(
    () => new AsYouType(country).input(nationalDigits),
    [country, nationalDigits]
  );

  const dialCode = useMemo(
    () => getCountryCallingCode(country),
    [country]
  );

  const syncFromValue = useCallback((v: string) => {
    if (!v) {
      setCountry(defaultCountry);
      setNationalDigits("");
      return;
    }
    const p = parsePhoneNumberFromString(v, defaultCountry);
    if (p) {
      setCountry((p.country ?? defaultCountry) as CountryCode);
      setNationalDigits(p.nationalNumber);
    } else {
      setNationalDigits(v.replace(/\D/g, "").slice(0, 15));
    }
  }, [defaultCountry]);

  React.useEffect(() => {
    syncFromValue(value);
  }, [value, syncFromValue]);

  const notifyChange = useCallback(
    (c: CountryCode, digits: string) => {
      const e164 =
        digits.length > 0
          ? `+${getCountryCallingCode(c)}${digits}`
          : "";
      onChangeText?.(e164);
    },
    [onChangeText]
  );

  const handleInputChange = useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, "").slice(0, 15);
      setNationalDigits(digits);
      notifyChange(country, digits);
    },
    [country, notifyChange]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countryOptions;
    return countryOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [countryOptions, query]);

  const selectCountry = useCallback(
    (code: string) => {
      const next = code as CountryCode;
      setCountry(next);
      notifyChange(next, nationalDigits);
      setPickerOpen(false);
      setQuery("");
    },
    [nationalDigits, notifyChange]
  );

  const placeholderTextColor = "rgba(255,255,255,0.45)";

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text variant="caption" style={{ opacity: 0.9 }}>
        {label}
      </Text>

      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [
            styles.trigger,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          hitSlop={4}
        >
          <Text style={{ color: theme.colors.text }}>
            +{dialCode}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={theme.colors.textMuted}
          />
        </Pressable>

        <View
          style={[styles.separator, { backgroundColor: theme.colors.border }]}
        />

        <TextInput
          value={displayValue}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          keyboardType="phone-pad"
          autoComplete="tel"
          autoCorrect={false}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamilyRegular,
            },
          ]}
        />
      </View>

      {error ? (
        <Text variant="caption" color={theme.colors.danger}>
          {error}
        </Text>
      ) : null}

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.overlay}
            onPress={() => {
              setPickerOpen(false);
              setQuery("");
            }}
          />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <View style={styles.header}>
              <Text weight="bold">Country</Text>
              <Button
                variant="icon"
                onPress={() => {
                  setPickerOpen(false);
                  setQuery("");
                }}
                height={40}
                left={
                  <Ionicons
                    name="close-sharp"
                    size={24}
                    color={theme.colors.accent}
                  />
                }
              />
            </View>

            <Card padded={false} background="surface2" style={styles.searchWrap}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t("common.search")}
                placeholderTextColor={placeholderTextColor}
                style={[
                  styles.searchInput,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamilyRegular,
                  },
                ]}
              />
            </Card>

            <FlatList
              data={filteredOptions}
              keyExtractor={(o) => o.value}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => selectCountry(item.value)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      borderColor:
                        country === item.value
                          ? theme.colors.accent
                          : theme.colors.border,
                      backgroundColor:
                        country === item.value
                          ? theme.colors.surface2
                          : "transparent",
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text weight="semibold">{item.label}</Text>
                  {country === item.value ? (
                    <Text color={theme.colors.accent} weight="bold">
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text muted>{t("common.noResults")}</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 8,
  },
  separator: {
    width: 1,
    height: 24,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 12,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  searchWrap: {
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: "center",
  },
  searchInput: {
    paddingVertical: 0,
  },
  listContent: {
    paddingVertical: 10,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  empty: {
    padding: 18,
    alignItems: "center",
  },
});
