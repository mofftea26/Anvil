import { toByteArray } from "base64-js";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/shared/supabase/client";

type Params = {
  bucket: string;
  path: string;
  fileUri: string;
  contentType: string;
  upsert?: boolean;
};

type Return = {
  uploadImage: (params: Params) => Promise<string>;
  uploading: boolean;
  progress: number | null;
  error: string | null;
  reset: () => void;
};

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const bytes = toByteArray(base64);
  // Supabase Storage in React Native expects ArrayBuffer; Uint8Array can "succeed" but upload 0 bytes.
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

function getFriendlyUploadErrorMessage(e: any): string {
  const msg = String(e?.message ?? e ?? "");
  if (!msg) return "Upload failed. Please try again.";

  // Common Supabase + network cases.
  if (msg.toLowerCase().includes("not authenticated")) return "Please sign in again.";
  if (msg.toLowerCase().includes("row level security") || msg.toLowerCase().includes("rls")) {
    return "Upload not allowed. Please check permissions.";
  }
  if (msg.toLowerCase().includes("bucket") && msg.toLowerCase().includes("not found")) {
    return "Storage bucket is missing. Please check backend configuration.";
  }
  return msg;
}

export function useSupabaseImageUpload(): Return {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setUploading(false);
    setProgress(null);
    setError(null);
  }, [clearTimer]);

  const uploadImage = useCallback(async (params: Params) => {
    clearTimer();
    setUploading(true);
    setError(null);
    setProgress(0);

    // Simulate progress to improve UX (Supabase JS doesn't expose real progress on RN).
    let p = 0;
    timerRef.current = setInterval(() => {
      p = Math.min(90, p + Math.max(1, Math.round(Math.random() * 7)));
      setProgress(p);
    }, 250) as unknown as number;

    try {
      const arrayBuffer = await uriToArrayBuffer(params.fileUri);
      const upsert = params.upsert ?? true;

      const { error: uploadErr } = await supabase.storage
        .from(params.bucket)
        .upload(params.path, arrayBuffer, {
          upsert,
          contentType: params.contentType,
        });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from(params.bucket).getPublicUrl(params.path);
      const publicUrl = data.publicUrl;

      setProgress(100);
      return publicUrl;
    } catch (e: any) {
      const friendly = getFriendlyUploadErrorMessage(e);
      setError(friendly);
      throw new Error(friendly);
    } finally {
      clearTimer();
      setUploading(false);
      // Leave "100%" briefly visible, then clear.
      setTimeout(() => setProgress(null), 600);
    }
  }, [clearTimer]);

  return { uploadImage, uploading, progress, error, reset };
}

