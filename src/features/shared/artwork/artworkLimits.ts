/**
 * Purpose:
 * Pure artwork size limits and dimension validation, usable on server and client.
 */
import { shared } from "@/content/shared";

export const MAX_CANVAS_DIMENSION = 1000;
export const MAX_PALETTE_ENTRIES = 256;
/** Most layers one artwork may have: the editor stops adding at it and files with more are refused. */
export const MAX_LAYERS = 64;
/**
 * Longest `referenceImageDataUrl` accepted in a file. The editor stores the reference scaled to
 * 512 px as WebP, or PNG where the browser can't encode WebP: 512 × 512 RGBA is 1 MiB raw, about
 * 1.4 MB as base64, so 2 MB leaves headroom.
 */
export const MAX_REFERENCE_IMAGE_DATA_URL_LENGTH = 2_000_000;

/** Whether an artwork with `layerCount` layers has room for one more (add or duplicate). */
export function canAddLayer(layerCount: number): boolean {
  return layerCount < MAX_LAYERS;
}

export function validateDimensions(width: number, height: number): void {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width > MAX_CANVAS_DIMENSION ||
    height > MAX_CANVAS_DIMENSION
  ) {
    throw new Error(shared.artwork.errors.dimensionsOutOfRange(MAX_CANVAS_DIMENSION));
  }
}
