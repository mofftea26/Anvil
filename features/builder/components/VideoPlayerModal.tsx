// Note: expo-av Video is deprecated in favor of expo-video, but expo-video requires a development build
// TODO: Migrate to expo-video when ready for development build
import { Video, ResizeMode } from "expo-av";
import React, { useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Icon, Text, useTheme } from "@/shared/ui";

type VideoPlayerModalProps = {
  visible: boolean;
  videoUrl: string | null;
  title: string;
  onClose: () => void;
};

export function VideoPlayerModal({
  visible,
  videoUrl,
  title,
  onClose,
}: VideoPlayerModalProps) {
  const theme = useTheme();
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});

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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text weight="bold" style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            shouldPlay={true}
            onPlaybackStatusUpdate={setStatus}
          />
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
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
