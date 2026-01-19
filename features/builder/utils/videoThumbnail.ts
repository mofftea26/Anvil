import { useEffect, useRef, useState } from "react";

const cache = new Map<string, string>();

export function useVideoThumbnail(videoUrl: string | null) {
  const [thumb, setThumb] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function run() {
      if (!videoUrl) {
        setThumb(null);
        return;
      }

      if (cache.has(videoUrl)) {
        setThumb(cache.get(videoUrl)!);
        return;
      }

      try {
         
        const mod = require("expo-video-thumbnails") as {
          getThumbnailAsync: (url: string, opts?: any) => Promise<{ uri: string }>;
        };

        const result = await mod.getThumbnailAsync(videoUrl, { time: 0 });
        if (!mountedRef.current) return;

        cache.set(videoUrl, result.uri);
        setThumb(result.uri);
      } catch {
        // If expo-video-thumbnails isn't installed or remote thumb fails
        if (!mountedRef.current) return;
        setThumb(null);
      }
    }

    run();
  }, [videoUrl]);

  return thumb;
}
