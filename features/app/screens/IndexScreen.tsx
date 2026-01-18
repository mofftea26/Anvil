import { Href, Redirect } from "expo-router";
import React from "react";

import { useIndexRouting } from "@/features/app/hooks/useIndexRouting";
import { FullscreenState } from "@/shared/components/FullscreenState";

export default function IndexScreen() {
  const decision = useIndexRouting();

  if (decision.type === "loading") {
    return (
      <FullscreenState title={decision.title} progress={decision.progress} />
    );
  }

  if (decision.type === "error") {
    return (
      <FullscreenState title={decision.title} subtitle={decision.subtitle} />
    );
  }

  return <Redirect href={decision.href as Href} />;
}
