import React from "react";

import { useCreateProgram } from "@/features/library/components/programs/createProgram/hooks/useCreateProgram";
import { LibraryPlaceholderView } from "@/features/library/components/shared/LibraryPlaceholderView";

export default function CreateProgramScreen() {
  const { title, subtitle } = useCreateProgram();
  return <LibraryPlaceholderView title={title} subtitle={subtitle} />;
}
