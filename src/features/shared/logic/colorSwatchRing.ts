/**
 * Purpose:
 * Picks the ring a palette swatch shows: selection (compact grid) or primary/secondary pick (comfortable row).
 */

import type {
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

/** Which non-hue corner markers a swatch shows: only the comfortable row marks its slots. */
export function colorSwatchMarkers(swatch: TColorSwatchRingInput): { primary: boolean; secondary: boolean } {
  if (swatch.density === "compact") {
    return { primary: false, secondary: false };
  }
  return { primary: swatch.isPrimary, secondary: swatch.isSecondary };
}
