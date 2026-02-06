import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { createAnimatedComponent } from "react-native-reanimated";

const AnimatedView = createAnimatedComponent(View);
const AnimatedBlurView = createAnimatedComponent(BlurView);

export function ProgramTemplateCarouselBackdrop(props: {
  visible: boolean;
  backdropStyle: any;
  topStyle: any;
  bottomStyle: any;
  leftStyle: any;
  rightStyle: any;
}) {
  if (!props.visible) return null;

  return (
    <AnimatedView
      pointerEvents="none"
      style={[styles.backdrop, props.backdropStyle]}
    >
      <AnimatedView style={[styles.region, props.topStyle]}>
        {Platform.OS === "ios" ? (
          <AnimatedBlurView
            intensity={18}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(0,0,0,0.12)" },
          ]}
        />
      </AnimatedView>

      <AnimatedView style={[styles.region, props.bottomStyle]}>
        {Platform.OS === "ios" ? (
          <AnimatedBlurView
            intensity={18}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(0,0,0,0.12)" },
          ]}
        />
      </AnimatedView>

      <AnimatedView style={[styles.region, props.leftStyle]}>
        {Platform.OS === "ios" ? (
          <AnimatedBlurView
            intensity={18}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(0,0,0,0.12)" },
          ]}
        />
      </AnimatedView>

      <AnimatedView style={[styles.region, props.rightStyle]}>
        {Platform.OS === "ios" ? (
          <AnimatedBlurView
            intensity={18}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(0,0,0,0.12)" },
          ]}
        />
      </AnimatedView>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  region: {
    position: "absolute",
    overflow: "hidden",
  },
});
