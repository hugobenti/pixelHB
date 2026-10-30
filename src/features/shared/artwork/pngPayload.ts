/**
 * Purpose:
 * Turn a canvas `toDataURL` PNG into a Blob, rejecting an empty payload.
 */

import { shared } from "@/content/shared";

const PNG_MIME = "image/png";

/** Decodes a base64 PNG data URL; throws `pngFailed` when the canvas produced no bytes (`"data:,"`). */
export function pngBlobFromDataUrl(dataUrl: string): Blob {
  const payload = dataUrl.split(",")[1];
  if (!payload) {
    throw new Error(shared.artworkFile.errors.pngFailed);
  }
  const binary = atob(payload);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: PNG_MIME });
}
