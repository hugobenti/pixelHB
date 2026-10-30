/**
 * Purpose:
 * Paints the "Made with PixelHB" strip (brand wordmark and the site host) onto an export canvas.
 *
 * Notes:
 * Browser only. The host text uses the app's sans font, so it is loaded before drawing.
 */
"use client";

import {
  BRAND_DARK_STATIC_THEME_COLORS,
  BRAND_STATIC_THEME_COLORS,
  WORDMARK_GRID,
} from "@/features/shared/brand/brandArt";
import { gridRuns } from "@/features/shared/brand/brandPixels";
import type { ICreditStripLayout } from "./creditStrip.type";

/** Light "paper" for the strip: the warm off-white the brand uses for ink on dark, never transparent. */
const STRIP_BACKGROUND = BRAND_DARK_STATIC_THEME_COLORS.i;
const HOST_COLOR = BRAND_STATIC_THEME_COLORS.i;
const HOST_WEIGHT = 600;
const FALLBACK_FONT_FAMILY = "sans-serif";

async function loadHostFont(fontPx: number): Promise<string> {
  const family =
    getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim() ||
    FALLBACK_FONT_FAMILY;
  const font = `${HOST_WEIGHT} ${fontPx}px ${family}`;
  try {
    await document.fonts.load(font);
  } catch {
    // The font could not load; the browser falls back along the family list.
  }
  return font;
}

export async function drawCreditStrip(
  ctx: CanvasRenderingContext2D,
  top: number,
  layout: ICreditStripLayout,
  host: string,
): Promise<void> {
  const font = await loadHostFont(layout.host.fontPx);
  ctx.fillStyle = STRIP_BACKGROUND;
  ctx.fillRect(0, top, ctx.canvas.width, layout.height);

  for (const run of gridRuns(WORDMARK_GRID)) {
    ctx.fillStyle = BRAND_STATIC_THEME_COLORS[run.key as keyof typeof BRAND_STATIC_THEME_COLORS];
    ctx.fillRect(
      layout.wordmark.x + run.x * layout.cellPx,
      top + layout.wordmark.y + run.y * layout.cellPx,
      run.length * layout.cellPx,
      layout.cellPx,
    );
  }

  ctx.font = font;
  ctx.fillStyle = HOST_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(host, layout.host.x, top + layout.host.baselineY);
}
