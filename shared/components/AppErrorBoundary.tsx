import React from "react";
import { FullscreenState } from "./FullscreenState";
import i18n from "../i18n/i18n";

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Keep it simple; you can wire Sentry later.
    console.error("[AppErrorBoundary]", error);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <FullscreenState
          title={i18n.t("state.crashedTitle")}
          subtitle={__DEV__ ? this.state.error.message : i18n.t("state.crashedSubtitle")}
          actionLabel={i18n.t("common.tryAgain")}
          onActionPress={this.reset}
        />
      );
    }

    return this.props.children;
  }
}

