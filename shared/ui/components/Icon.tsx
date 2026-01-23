import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import type { ComponentProps } from "react";

import { getHugeiconName } from "../utils/iconMapping";

// Import commonly used icons
import {
  Add01Icon,
  AddCircleIcon,
  Alert01Icon,
  Analytics01Icon,
  AnalyticsDownIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Award01Icon,
  AiNetworkIcon,
  Book01Icon,
  Calendar01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  DashboardSpeed01Icon,
  Delete01Icon,
  Dumbbell01Icon,
  Edit01Icon,
  EyeIcon,
  FireIcon,
  FlashIcon,
  GridIcon,
  HourglassIcon,
  InformationCircleIcon,
  Key01Icon,
  LayerIcon,
  ListViewIcon,
  LockIcon,
  Mail01Icon,
  PauseCircleIcon,
  Pulse01Icon,
  QrCodeIcon,
  QuestionIcon,
  Refresh01Icon,
  Search01Icon,
  Settings01Icon,
  Timer01Icon,
  Upload01Icon,
  UserGroupIcon,
  UserIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons";

// Icon component cache
const iconComponents: Record<string, any> = {
  Add01Icon,
  AddCircleIcon,
  Alert01Icon,
  Analytics01Icon,
  AnalyticsDownIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Award01Icon,
  AiNetworkIcon,
  Book01Icon,
  Calendar01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  DashboardSpeed01Icon,
  Delete01Icon,
  Dumbbell01Icon,
  Edit01Icon,
  EyeIcon,
  FireIcon,
  FlashIcon,
  GridIcon,
  HourglassIcon,
  InformationCircleIcon,
  Key01Icon,
  LayerIcon,
  ListViewIcon,
  LockIcon,
  Mail01Icon,
  PauseCircleIcon,
  Pulse01Icon,
  QrCodeIcon,
  QuestionIcon,
  Refresh01Icon,
  Search01Icon,
  Settings01Icon,
  Timer01Icon,
  Upload01Icon,
  UserGroupIcon,
  UserIcon,
  Video01Icon,
};

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
} & Omit<ComponentProps<typeof HugeiconsIcon>, "icon">;

/**
 * Icon component that maps Ionicons-style names to Hugeicons
 * Usage: <Icon name="search" size={24} color="red" />
 */
export function Icon({ name, size = 24, color = "currentColor", strokeWidth = 1.5, ...props }: IconProps) {
  const hugeiconName = getHugeiconName(name);
  const IconComponent = iconComponents[hugeiconName];

  if (!IconComponent) {
    console.warn(`Icon "${name}" (mapped to "${hugeiconName}") not found. Using QuestionIcon.`);
    return (
      <HugeiconsIcon
        icon={QuestionIcon}
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        {...props}
      />
    );
  }

  return (
    <HugeiconsIcon
      icon={IconComponent}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
