import React from "react";

import { LibraryPlaceholderView } from "@/features/library/components/shared/LibraryPlaceholderView";
import { usePrograms } from "@/features/library/hooks/programs/usePrograms";

export default function ProgramsScreen() {
  const { title, subtitle } = usePrograms();
  return <LibraryPlaceholderView title={title} subtitle={subtitle} />;
}
