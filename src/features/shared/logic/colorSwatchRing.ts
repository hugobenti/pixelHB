/**
 * Purpose:
 * Picks the ring a palette swatch shows: selection (compact grid) or primary/secondary pick (comfortable row).
 */

import type {
  TColorSwatchMarkerInput,
  TColorSwatchRing,
  TColorSwatchRingInput,
} from "@/features/shared/components/ColorSwatch.type";

export function colorSwatchRing(swatch: TColorSwatchRingInput): TColorSwatchRing {
  if (swatch.density === "compact") {
    return swatch.selected ? "selected" : "idle";
  }
  if (swatch.isPrimary && swatch.isSecondary) {
    return "both";
  }
  if (swatch.isPrimary) {
    return "primary";
  }
  if (swatch.isSecondary) {
    return "secondary";
  }
  return "idle";
}

/**
 * Which non-hue corner markers a swatch shows: only the comfortable row marks its slots. The active slot's
 * swatch gets the top-left marker and the other slot's swatch the bottom-right one, like the color-pair chip.
 */
export function colorSwatchMarkers(swatch: TColorSwatchMarkerInput): { topLeft: boolean; bottomRight: boolean } {
  if (swatch.density === "compact") {
    return { topLeft: false, bottomRight: false };
  }
  const activeHere = swatch.activeSlot === "primary" ? swatch.isPrimary : swatch.isSecondary;
  const otherHere = swatch.activeSlot === "primary" ? swatch.isSecondary : swatch.isPrimary;
  return { topLeft: activeHere, bottomRight: otherHere };
}
