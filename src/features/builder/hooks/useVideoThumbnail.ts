import * as VideoThumbnails from "expo-video-thumbnails/build/VideoThumbnails";
import { useEffect, useState } from "react";

export function useVideoThumbnail(videoUrl?: string | null) {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!videoUrl) {
        setThumbnailUri(null);
        return;
      }

      try {
        setIsLoading(true);
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
          time: 1000,
        });

        if (!alive) return;
        setThumbnailUri(uri);
      } catch {
        if (!alive) return;
        setThumbnailUri(null);
      } finally {
        if (!alive) return;
        setIsLoading(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [videoUrl]);

  return { thumbnailUri, isLoading };
}
