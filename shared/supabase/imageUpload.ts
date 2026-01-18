// Use the legacy FS API to avoid deprecation warnings in SDK 54.
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { toByteArray } from "base64-js";

export async function uriToUint8ArrayJpeg(uri: string): Promise<{
  bytes: Uint8Array;
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
  return { bytes, contentType: "image/jpeg" };
}

