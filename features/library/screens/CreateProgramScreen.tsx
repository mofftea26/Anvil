import React from "react";

import { LibraryPlaceholderView } from "@/features/library/components/shared/LibraryPlaceholderView";
import { useCreateProgram } from "@/features/library/hooks/create-program/useCreateProgram";

export default function CreateProgramScreen() {
  const { title, subtitle } = useCreateProgram();
  return <LibraryPlaceholderView title={title} subtitle={subtitle} />;
}
