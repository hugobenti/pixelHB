/**
 * Purpose:
 * Pure layout of the "Made with PixelHB" strip drawn below an exported PNG: its height for a given
 * export width, and where the wordmark and the host text go inside it.
 */
import { WORDMARK_GRID } from "@/features/shared/brand/brandArt";
import type { ICreditStripLayout } from "./creditStrip.type";

export const CREDIT_MIN_EXPORT_WIDTH = 256;

const MIN_STRIP_HEIGHT = 32;
const STRIP_WIDTH_RATIO = 0.08;
/** Share of the strip the wordmark may cover vertically (before rounding its pixel size down). */
const WORDMARK_HEIGHT_SHARE = 0.4;
const HOST_FONT_SHARE = 0.3;
const MIN_HOST_FONT_PX = 12;
/** Distance from the baseline to the strip's vertical middle, as a share of the font size. */
const BASELINE_DROP = 0.36;

const WORDMARK_COLUMNS = WORDMARK_GRID[0].length;
const WORDMARK_ROWS = WORDMARK_GRID.length;

export function creditStripHeight(exportWidth: number): number {
  if (exportWidth < CREDIT_MIN_EXPORT_WIDTH) {
    return 0;
  }
  return Math.max(MIN_STRIP_HEIGHT, Math.round(exportWidth * STRIP_WIDTH_RATIO));
}

export function creditStripLayout(exportWidth: number): ICreditStripLayout {
  const height = creditStripHeight(exportWidth);
  const cellPx = Math.max(1, Math.floor((height * WORDMARK_HEIGHT_SHARE) / WORDMARK_ROWS));
  const wordmarkY = Math.floor((height - WORDMARK_ROWS * cellPx) / 2);
  const wordmarkX = wordmarkY;
  const fontPx = Math.max(MIN_HOST_FONT_PX, Math.round(height * HOST_FONT_SHARE));
  return {
    height,
    cellPx,
    wordmark: { x: wordmarkX, y: wordmarkY },
    host: {
      x: wordmarkX + WORDMARK_COLUMNS * cellPx + wordmarkX,
      baselineY: Math.round(height / 2 + fontPx * BASELINE_DROP),
      fontPx,
    },
  };
}
