import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { SetTypeRow } from "../types/setTypes";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function getSetTypeIconName(setType: Pick<SetTypeRow, "key" | "title">): IoniconName {
  const k = (setType.key || "").toLowerCase();
  const t = (setType.title || "").toLowerCase();

  // Foundational
  if (k.includes("warm") || t.includes("warm")) return "flame";
  if (k.includes("working") || t.includes("working")) return "barbell";
  if (k.includes("back") || t.includes("back-off")) return "refresh";
  if (k.includes("peak") || t.includes("peak")) return "trophy";

  // Intensity methods
  if (k.includes("drop") || t.includes("drop")) return "trending-down";
  if (k.includes("rest") || t.includes("rest-pause")) return "pause-circle";
  if (k.includes("cluster") || t.includes("cluster")) return "git-network";
  if (k.includes("variable") || t.includes("variable")) return "options";
  if (k.includes("iso") || t.includes("iso")) return "pulse";
  if (k.includes("pre") || t.includes("pre-fatigue")) return "flash";

  // Volume / conditioning
  if (k.includes("density") || t.includes("density")) return "timer";

  return "fitness";
}

export function guessSetTypeCategory(setType: Pick<SetTypeRow, "key" | "title">) {
  const title = (setType.title || "").toLowerCase();
  const key = (setType.key || "").toLowerCase();

  const foundational = ["warm", "working", "back-off", "peak"];
  const volume = ["density"];

  if (foundational.some((x) => title.includes(x) || key.includes(x))) return "foundational";
  if (volume.some((x) => title.includes(x) || key.includes(x))) return "volume";

  return "intensity";
}

export const setTypeCategoryTitle: Record<string, string> = {
  foundational: "Foundational Sets",
  intensity: "Intensity-Boosting Methods",
  volume: "Volume & Conditioning Methods",
};
