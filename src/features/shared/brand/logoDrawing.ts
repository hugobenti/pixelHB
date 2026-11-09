/**
 * Purpose:
 * The lockups as SVG rects for the in-app logo, with the theme keys mapped to tokens so the wordmark
 * and the drawn pixel follow the light or dark theme.
 */

import type { IBrandLockupPart } from "./brandPixels.type";
import { BRAND_FIXED_COLORS, HORIZONTAL_LOCKUP, PENCIL_LOCKUP } from "./brandArt";
import type { IBrandLogoDrawing } from "./BrandLogo.type";
import { lockup } from "./brandPixels";

const UI_COLORS: Readonly<Record<string, string>> = {
  ...BRAND_FIXED_COLORS,
  d: "var(--color-fg)",
  i: "var(--color-fg)",
  h: "var(--color-brand-hb)",
};

export function logoDrawing(parts: readonly IBrandLockupPart[]): IBrandLogoDrawing {
  const art = lockup(parts);
  return {
    viewBox: `0 0 ${art.width} ${art.height}`,
    rects: art.runs.map((run) => ({
      id: `${run.x}-${run.y}`,
      x: run.x,
      y: run.y,
      width: run.length,
      fill: UI_COLORS[run.key],
    })),
  };
}

export const HORIZONTAL_LOGO = logoDrawing(HORIZONTAL_LOCKUP);
export const PENCIL_LOGO = logoDrawing(PENCIL_LOCKUP);
