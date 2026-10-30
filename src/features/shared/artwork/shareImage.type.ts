export type TShareMethod = "native" | "clipboard" | "download";

export interface IShareEnv {
  canShare?(data: ShareData): boolean;
  share?(data: ShareData): Promise<void>;
  /** Present only when the browser can write images to the clipboard. Must be invoked in the click's synchronous turn. */
  writeImage?(blob: Blob): Promise<void>;
  download(): void;
}

export interface IShareablePng {
  blob: Blob;
  file: File;
}
