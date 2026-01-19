import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export type PreparedSquareImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
  fileSize: number;
  extension: string;
};

export type PickAndPrepareSquareImageOptions = {
  /** Max output dimension (square). Default: 1024 */
  maxSize?: number;
  /** Minimum required dimension (square). Default: 256 */
  minSize?: number;
  /**
   * Max output bytes. Default:
   * - web: 500KB
   * - native: 1MB
   */
  maxBytes?: number;
};

export function validateImageConstraints(
  prepared: PreparedSquareImage,
  options?: PickAndPrepareSquareImageOptions
): void {
  const maxSize = options?.maxSize ?? 1024;
  const minSize = options?.minSize ?? 256;
  const maxBytes =
    options?.maxBytes ??
    (Platform.OS === "web" ? 500_000 : 1_000_000);

  if (prepared.width !== prepared.height) {
    throw new Error("Please choose a square (1:1) image.");
  }
  if (prepared.width < minSize || prepared.height < minSize) {
    throw new Error(`Image is too small. Minimum is ${minSize}×${minSize}.`);
  }
  if (prepared.width > maxSize || prepared.height > maxSize) {
    throw new Error(`Image is too large. Maximum is ${maxSize}×${maxSize}.`);
  }
  if (prepared.fileSize > maxBytes) {
    const kb = Math.round(maxBytes / 1000);
    throw new Error(`Image file is too large. Max is ${kb}KB.`);
  }
}

function pickOutputFormat(): {
  format: ImageManipulator.SaveFormat;
  mimeType: string;
  extension: string;
} {
  // Expo: use JPEG output for maximum compatibility.
  return { format: ImageManipulator.SaveFormat.JPEG, mimeType: "image/jpeg", extension: "jpg" };
}

async function getFileSizeBytes(uri: string): Promise<number> {
  // expo-file-system/legacy types don't expose `size`, but runtime does.
  const info = await (FileSystem as any).getInfoAsync(uri, { size: true });
  return typeof info?.size === "number" ? (info.size as number) : Number.NaN;
}

/**
 * Picks an image, center-crops to square, resizes to <= maxSize, compresses to <= maxBytes.
 * Returns null when the user cancels.
 */
export async function pickAndPrepareSquareImage(
  options?: PickAndPrepareSquareImageOptions
): Promise<PreparedSquareImage | null> {
  const maxSize = options?.maxSize ?? 1024;
  const minSize = options?.minSize ?? 256;
  const maxBytes =
    options?.maxBytes ??
    (Platform.OS === "web" ? 500_000 : 1_000_000);

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error("Permission denied. Please allow photo library access.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"] as ImagePicker.MediaType[],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (result.canceled) return null;

  const asset = result.assets?.[0];
  const uri = asset?.uri;
  const width = asset?.width;
  const height = asset?.height;
  if (!uri) return null;

  if (!width || !height) {
    throw new Error("Could not read image dimensions. Please try another image.");
  }

  const side = Math.min(width, height);
  if (side < minSize) {
    throw new Error(`Image is too small. Minimum is ${minSize}×${minSize}.`);
  }

  const crop = {
    originX: Math.floor((width - side) / 2),
    originY: Math.floor((height - side) / 2),
    width: side,
    height: side,
  };

  const target = Math.min(maxSize, side);
  const { format, mimeType, extension } = pickOutputFormat();

  // Try multiple compression levels to satisfy maxBytes.
  const qualities = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5, 0.42, 0.34];

  let last: ImageManipulator.ImageResult | null = null;
  let lastSize = Number.NaN;

  for (const q of qualities) {
    const out = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop }, { resize: { width: target, height: target } }],
      { compress: q, format }
    );

    const fileSize = await getFileSizeBytes(out.uri);
    last = out;
    lastSize = fileSize;

    const prepared: PreparedSquareImage = {
      uri: out.uri,
      width: out.width ?? target,
      height: out.height ?? target,
      mimeType,
      fileSize,
      extension,
    };

    try {
      validateImageConstraints(prepared, { maxSize, minSize, maxBytes });
      return prepared;
    } catch {
      // keep trying lower quality
    }
  }

  if (last) {
    const prepared: PreparedSquareImage = {
      uri: last.uri,
      width: last.width ?? Math.min(maxSize, side),
      height: last.height ?? Math.min(maxSize, side),
      mimeType,
      fileSize: lastSize,
      extension,
    };
    // Throw a friendly error for final failure.
    validateImageConstraints(prepared, { maxSize, minSize, maxBytes });
  }

  throw new Error("Failed to process image. Please try another image.");
}

