/**
 * Purpose:
 * Pure helpers to add, update, or remove palette entries while keeping pixel indices consistent;
 * a removal is recorded so undo can restore the color and its pixels.
 */

import { normalizeHexColor, parseHexColor } from "@/features/shared/utils/colorConverter";

import { MAX_PALETTE_ENTRIES } from "@/features/shared/artwork/artworkLimits";
import { TRANSPARENT_PIXEL_INDEX } from "@/features/shared/artwork/artworkService";
import type { IPaletteRemoval } from "@/features/editor/types/editor.type";
import type {
  IColorSlots,
  IPaletteLayerBuffer,
  IPaletteRemovalResult,
} from "./paletteMutations.type";

/**
 * Clamps a palette slot index to valid palette bounds (0 … length − 1).
 */
export function clampPaletteIndex(index: number, paletteLength: number): number {
  if (paletteLength <= 0) {
    return 0;
  }
  const max = paletteLength - 1;
  return Math.min(Math.max(0, index), max);
}

export function setPaletteColorAt(palette: string[], index: number, hex: string): string[] {
  const next = [...palette];
  if (index < 0 || index >= next.length) {
    return next;
  }
  next[index] = normalizeHexColor(hex);
  return next;
}

/**
 * True when the palette already holds this color; compares normalized hex, so case and #RGB shorthand match.
 */
export function paletteHasColor(palette: string[], hex: string): boolean {
  const target = normalizeHexColor(hex);
  return palette.some((entry) => normalizeHexColor(entry) === target);
}

/**
 * Appends a color; null when the palette is full or already holds the color.
 */
export function appendPaletteColor(palette: string[], hex: string): string[] | null {
  if (palette.length >= MAX_PALETTE_ENTRIES || paletteHasColor(palette, hex)) {
    return null;
  }
  return [...palette, normalizeHexColor(hex)];
}

function slotAfterRemoval(index: number, removeIndex: number, nextLength: number): number {
  const shifted = index > removeIndex ? index - 1 : index === removeIndex ? 0 : index;
  return clampPaletteIndex(shifted, nextLength);
}

/**
 * Forward remap of one buffer: the removed index becomes `replacement` (already an index in the
 * palette without the removed color, or the transparent index), higher palette indices move down by
 * one. Values outside the palette (`>= paletteLength`, e.g. the 255 transparent fill) are left alone.
 */
function remapForRemoval(
  pixelData: Uint8Array,
  removeIndex: number,
  paletteLength: number,
  replacement: number,
): void {
  for (let i = 0; i < pixelData.length; i++) {
    const v = pixelData[i];
    if (v === removeIndex) {
      pixelData[i] = replacement;
    } else if (v > removeIndex && v < paletteLength) {
      pixelData[i] = v - 1;
    }
  }
}

/** How many pixels, across every layer, use palette index `index`. */
export function countColorUsage(layers: readonly IPaletteLayerBuffer[], index: number): number {
  let count = 0;
  for (const { pixelData } of layers) {
    for (let i = 0; i < pixelData.length; i++) {
      if (pixelData[i] === index) {
        count++;
      }
    }
  }
  return count;
}

function rgbChannels(hex: string): [number, number, number] | null {
  const parsed = parseHexColor(hex);
  if (!parsed) {
    return null;
  }
  const value = Number.parseInt(parsed.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/**
 * The palette entry closest to `palette[index]` by RGB distance, excluding the entry itself (the
 * lower index wins a tie), or null when there is no other entry.
 */
export function nearestPaletteIndex(palette: readonly string[], index: number): number | null {
  const target = rgbChannels(palette[index] ?? "");
  let best: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < palette.length; i++) {
    if (i === index) {
      continue;
    }
    const rgb = rgbChannels(palette[i]);
    const distance =
      target && rgb
        ? (target[0] - rgb[0]) ** 2 + (target[1] - rgb[1]) ** 2 + (target[2] - rgb[2]) ** 2
        : Number.MAX_VALUE;
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Removes one palette entry: the pixels that used it take `replacementIndex` (another entry of the
 * current palette, or null for transparent), every layer buffer is remapped in place, those pixels are
 * recorded (so undo can restore them) and the primary/secondary selection is clamped.
 */
export function removePaletteColor(
  layers: readonly IPaletteLayerBuffer[],
  palette: string[],
  removeIndex: number,
  slots: IColorSlots,
  replacementIndex: number | null,
): IPaletteRemovalResult | null {
  if (palette.length <= 1 || removeIndex < 0 || removeIndex >= palette.length) {
    return null;
  }
  if (
    replacementIndex !== null &&
    (replacementIndex === removeIndex || replacementIndex < 0 || replacementIndex >= palette.length)
  ) {
    return null;
  }
  const replacement =
    replacementIndex === null
      ? TRANSPARENT_PIXEL_INDEX
      : replacementIndex > removeIndex
        ? replacementIndex - 1
        : replacementIndex;
  const removedPixels = layers.map(({ id, pixelData }) => {
    let count = 0;
    for (let i = 0; i < pixelData.length; i++) {
      if (pixelData[i] === removeIndex) {
        count++;
      }
    }
    const indices = new Uint32Array(count);
    let next = 0;
    for (let i = 0; i < pixelData.length; i++) {
      if (pixelData[i] === removeIndex) {
        indices[next++] = i;
      }
    }
    remapForRemoval(pixelData, removeIndex, palette.length, replacement);
    return { layerId: id, indices };
  });
  const nextPalette = palette.filter((_, i) => i !== removeIndex);
  return {
    palette: nextPalette,
    slots: {
      primaryIndex: slotAfterRemoval(slots.primaryIndex, removeIndex, nextPalette.length),
      secondaryIndex: slotAfterRemoval(slots.secondaryIndex, removeIndex, nextPalette.length),
    },
    removal: { index: removeIndex, color: palette[removeIndex], replacement, removedPixels },
  };
}

/**
 * Redo of a palette removal: remaps every current layer again. `paletteLength` is the current
 * palette length, which still includes the color being removed.
 */
export function reapplyPaletteRemoval(
  removal: IPaletteRemoval,
  layers: readonly IPaletteLayerBuffer[],
  paletteLength: number,
): void {
  for (const layer of layers) {
    remapForRemoval(layer.pixelData, removal.index, paletteLength, removal.replacement);
  }
}

/**
 * Undo of a palette removal: palette indices at or above the removed slot move back up by one on
 * every current layer, then the recorded pixels get the restored color again. `paletteLength` is the
 * current palette length (without the removed color); values at or above it are transparent and
 * stay unchanged, so they can't wrap past 255 into a real color.
 */
export function revertPaletteRemoval(
  removal: IPaletteRemoval,
  layers: readonly IPaletteLayerBuffer[],
  paletteLength: number,
): void {
  for (const { pixelData } of layers) {
    for (let i = 0; i < pixelData.length; i++) {
      const v = pixelData[i];
      if (v >= removal.index && v < paletteLength) {
        pixelData[i] = v + 1;
      }
    }
  }
  for (const { layerId, indices } of removal.removedPixels) {
    const pixelData = layers.find((layer) => layer.id === layerId)?.pixelData;
    if (!pixelData) {
      continue;
    }
    for (const index of indices) {
      pixelData[index] = removal.index;
    }
  }
}
