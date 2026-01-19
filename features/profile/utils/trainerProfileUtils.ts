import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "@/shared/supabase/client";

export async function uploadImageFromUri(
  bucket: string,
  path: string,
  uri: string,
  contentType?: string
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const ct = contentType || "image/jpeg";

  // 1) Try overwrite first
  const { error: updateErr } = await supabase.storage.from(bucket).update(path, bytes, {
    contentType: ct,
    upsert: true,
  });

  // 2) If update fails (rare), fallback to upload
  if (updateErr) {
    const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, bytes, {
      contentType: ct,
      upsert: true,
    });
    if (uploadErr) throw uploadErr;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function isHexColor(v: string) {
  const s = v.trim();
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();
  const hasAlpha = h.length === 8;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = hasAlpha ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const finalA = Math.max(0, Math.min(1, alpha * a));
  return `rgba(${r},${g},${b},${finalA})`;
}

export function parseCerts(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}
