// Use the legacy FS API to avoid deprecation warnings in SDK 54.
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { toByteArray } from "base64-js";

export async function uriToUint8ArrayJpeg(uri: string): Promise<{
  arrayBuffer: ArrayBuffer;
  contentType: "image/jpeg";
}> {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 768 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  const base64 = await FileSystem.readAsStringAsync(resized.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const bytes = toByteArray(base64);
  // Supabase Storage in React Native expects ArrayBuffer; Uint8Array can "succeed" but upload 0 bytes.
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  return { arrayBuffer, contentType: "image/jpeg" };
}

