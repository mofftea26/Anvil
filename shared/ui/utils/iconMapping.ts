/**
 * Maps Ionicons names to Hugeicons icon names
 * Hugeicons uses PascalCase with "Icon" suffix (e.g., Search01Icon, AddCircleIcon)
 */
export const iconMap: Record<string, string> = {
  // Navigation
  "chevron-back": "ArrowLeft01Icon",
  "chevron-forward": "ArrowRight01Icon",
  "chevron-down": "ArrowDown01Icon",
  "chevron-up": "ArrowUp01Icon",
  
  // Actions
  "add-circle-outline": "AddCircleIcon",
  "add": "Add01Icon",
  "close": "Cancel01Icon",
  "close-circle": "CancelCircleIcon",
  "checkmark-circle": "CheckmarkCircle01Icon",
  "create-outline": "Edit01Icon",
  "pencil": "Edit01Icon",
  
  // People
  "person": "UserIcon",
  "person-outline": "UserIcon",
  
  // Search & Filter
  "search": "Search01Icon",
  "search-outline": "Search01Icon",
  
  // Notifications
  "information-circle": "InformationCircleIcon",
  "warning": "Alert01Icon",
  
  // Files & Upload
  "cloud-upload-outline": "Upload01Icon",
  
  // Common UI
  "grid": "GridIcon",
  "grid-outline": "GridIcon",
  "barbell": "Dumbbell01Icon",
  "barbell-outline": "Dumbbell01Icon",
  "list-outline": "ListViewIcon",
  "calendar-outline": "Calendar01Icon",
  "book-outline": "Book01Icon",
  
  // Tab Icons
  "analytics": "Analytics01Icon",
  "analytics-outline": "Analytics01Icon",
  "layers": "LayerIcon",
  "layers-outline": "LayerIcon",
  "people": "UserGroupIcon",
  "people-outline": "UserGroupIcon",
  
  // Set Type Icons
  "flame": "FireIcon",
  "refresh": "Refresh01Icon",
  "trophy": "Award01Icon",
  "trending-down": "AnalyticsDownIcon",
  "pause-circle": "PauseCircleIcon",
  "git-network": "AiNetworkIcon",
  "options": "Settings01Icon",
  "pulse": "Pulse01Icon",
  "flash": "FlashIcon",
  "flash-outline": "FlashIcon",
  "timer": "Timer01Icon",
  "fitness": "Dumbbell01Icon",
  
  // Other
  "speedometer": "DashboardSpeed01Icon",
  "qr-code-outline": "QrCodeIcon",
  "key-outline": "Key01Icon",
  "copy-outline": "Copy01Icon",
  "eye-outline": "EyeIcon",
  "eye-off-outline": "EyeIcon", // Using EyeIcon for both - can be styled differently if needed
  "close-sharp": "Cancel01Icon",
  "hourglass-outline": "HourglassIcon",
  "timer-outline": "Timer01Icon",
  "trash": "Delete01Icon",
  "videocam": "Video01Icon",
  "checkmark": "CheckmarkCircle01Icon",
};

/**
 * Get Hugeicons icon name from Ionicons name
 */
export function getHugeiconName(ioniconName: string): string {
  return iconMap[ioniconName] || "QuestionIcon";
}
