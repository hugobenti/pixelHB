/**
 * Purpose:
 * Pure artwork size limits and dimension validation, usable on server and client.
 */
import { shared } from "@/content/shared";

export const MAX_CANVAS_DIMENSION = 1000;
export const MAX_PALETTE_ENTRIES = 256;

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
