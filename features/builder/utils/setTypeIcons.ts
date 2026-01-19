import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function getSetTypeIconName(setTypeName?: string | null): IoniconName {
  const n = (setTypeName ?? "").toLowerCase();

  if (n.includes("drop")) return "trending-down";
  if (n.includes("rest")) return "pause";
  if (n.includes("cluster")) return "apps";
  if (n.includes("superset")) return "swap-horizontal";
  if (n.includes("giant")) return "repeat";
  if (n.includes("tempo")) return "speedometer";
  if (n.includes("isometric")) return "remove";
  if (n.includes("eccentric")) return "arrow-down";
  if (n.includes("pause")) return "pause-circle";
  if (n.includes("burn")) return "flame";
  if (n.includes("pyramid")) return "triangle";

  return "flash";
}
