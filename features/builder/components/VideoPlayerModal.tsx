import { Video, ResizeMode } from "expo-av";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Icon, Text, useTheme } from "@/shared/ui";

const SPEED_OPTIONS = [0.5, 0.75, 1, 2] as const;
type SpeedOption = (typeof SPEED_OPTIONS)[number];

type VideoPlayerModalProps = {
  visible: boolean;
  videoUrl: string | null;
  title: string;
  onClose: () => void;
  /** Exercise detail mode: autoplay, muted, no native controls, speed + fullscreen overlay. */
  variant?: "default" | "exerciseDetail";
};

export function VideoPlayerModal({
  visible,
  videoUrl,
  title,
  onClose,
  variant = "default",
}: VideoPlayerModalProps) {
  const theme = useTheme();
  const videoRef = useRef<React.ComponentRef<typeof Video>>(null);
  const [rate, setRate] = useState<SpeedOption>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isExerciseDetail = variant === "exerciseDetail";

  const cycleSpeed = useCallback(() => {
    setRate((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev);
      const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!visible || !isExerciseDetail) return;
    const applyRate = async () => {
      try {
        await videoRef.current?.setRateAsync(rate, false);
      } catch {
        // ignore
      }
    };
    applyRate();
  }, [visible, isExerciseDetail, rate]);

  // Reset fullscreen when modal closes
  useEffect(() => {
    if (!visible) setIsFullscreen(false);
  }, [visible]);

  if (!videoUrl) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, isFullscreen && styles.containerFullscreen]}>
        {(!isFullscreen || !isExerciseDetail) && (
          <View style={styles.header}>
            <Text weight="bold" style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
        )}

        <View style={[styles.videoContainer, isFullscreen && styles.videoContainerFullscreen]}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            useNativeControls={!isExerciseDetail}
            resizeMode={ResizeMode.CONTAIN}
            isLooping={isExerciseDetail}
            shouldPlay={true}
            isMuted={isExerciseDetail}
          />

          {isExerciseDetail && (
            <View style={styles.overlay} pointerEvents="box-none">
              <View style={styles.overlayButtons}>
                <Pressable
                  onPress={cycleSpeed}
                  style={({ pressed }) => [
                    styles.overlayButton,
                    {
                      backgroundColor: "rgba(0,0,0,0.6)",
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text weight="bold" style={[styles.speedLabel, { color: theme.colors.text }]}>
                    {rate}x
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setIsFullscreen((f) => !f)}
                  style={({ pressed }) => [
                    styles.overlayButton,
                    {
                      backgroundColor: "rgba(0,0,0,0.6)",
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Icon
                    name={isFullscreen ? "close" : "grid"}
                    size={20}
                    color={theme.colors.text}
                  />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.98)",
  },
  containerFullscreen: {
    paddingTop: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  title: {
    fontSize: 18,
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  videoContainerFullscreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 50,
    paddingRight: 16,
  },
  overlayButtons: {
    flexDirection: "row",
    gap: 10,
  },
  overlayButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  speedLabel: {
    fontSize: 14,
  },
});
