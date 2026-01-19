declare module "expo-video-thumbnails" {
  export type ThumbnailOptions = {
    time?: number;
    quality?: number;
  };

  export type ThumbnailResult = {
    uri: string;
    width: number;
    height: number;
  };

  export function getThumbnailAsync(
    source: string,
    options?: ThumbnailOptions
  ): Promise<ThumbnailResult>;
}

