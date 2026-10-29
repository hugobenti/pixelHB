/**
 * Purpose:
 * The PixelHB logo as pixel grids and their colors: the one source every logo, icon and social image
 * is drawn from. Spec and usage rules: docs/design/brand.md.
 *
 * Notes:
 * Colors are pixel data (like artwork palettes), not UI styling. The theme keys (`d`, `i`, `h`) come
 * from tokens in the live UI; `BRAND_STATIC_THEME_COLORS` are their light-theme values for images.
 */

import type { IBrandLockupPart } from "./brandPixels.type";
import type { TBrandFixedKey, TBrandGrid, TBrandGridName, TBrandThemeKey } from "./brandArt.type";

/** Side-on pencil with HB stamped on it, pointing right, plus one freshly drawn pixel. 33 × 7. */
export const PENCIL_GRID: TBrandGrid = [
  ".eeeemMmyyyyyyyyyyyyyyyyww.......",
  "efffemMmyyyysysyssyyyyyywwww.....",
  "eeeeemMmYYYYsYsYsYsYYYYYwwwwwq...",
  "eeeeemMmYYYYsssYssYYYYYYwwwwwGG.d",
  "eeeeemMmYYYYsYsYsYsYYYYYWWWWWG...",
  "EEEEEMMMoooososossooooooWWWW.....",
  ".EEEEMMMooooooooooooooooWW.......",
];

/** "PixelHB" in 5 × 7 pixel letters. 37 × 7. */
export const WORDMARK_GRID: TBrandGrid = [
  "iiii...i..............ii..h...h.hhhh.",
  "i...i..................i..h...h.h...h",
  "i...i.ii..i...i..iii...i..h...h.h...h",
  "iiii...i...i.i..i...i..i..hhhhh.hhhh.",
  "i......i....i...iiiii..i..h...h.h...h",
  "i......i...i.i..i......i..h...h.h...h",
  "i.....iii.i...i..iiii.iii.h...h.hhhh.",
];

/** Wordmark column where "HB" starts; the empty column before it separates it from "Pixel". */
const WORDMARK_HB_COLUMN = 26;

/** "Pixel" alone, from the wordmark. 25 × 7. */
export const PIXEL_WORD_GRID: TBrandGrid = WORDMARK_GRID.map((row) => row.slice(0, WORDMARK_HB_COLUMN - 1));

/** "HB" alone, from the wordmark. 11 × 7. */
export const HB_WORD_GRID: TBrandGrid = WORDMARK_GRID.map((row) => row.slice(WORDMARK_HB_COLUMN));

/** The pencil with a long body stamped "PIXEL HB", for banners and the social image. 50 × 7. */
export const BRAND_PENCIL_GRID: TBrandGrid = [
  ".eeeemMmyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyww.......",
  "efffemMmyyssyysssysysysssysyyyyysysyssyyywwww.....",
  "eeeeemMmYYsYsYYsYYsYsYsYYYsYYYYYsYsYsYsYYwwwwwq...",
  "eeeeemMmYYssYYYsYYYsYYssYYsYYYYYsssYssYYYwwwwwGG.d",
  "eeeeemMmYYsYYYYsYYsYsYsYYYsYYYYYsYsYsYsYYWWWWWG...",
  "EEEEEMMMoosooosssosososssosssooososossoooWWWW.....",
  ".EEEEMMMoooooooooooooooooooooooooooooooooWW.......",
];

/** The square icon: the pencil seen from its tip. 16 × 16. */
export const PENCIL_END_GRID: TBrandGrid = [
  "................",
  ".....yyyyYY.....",
  "....yyyyyYYY....",
  "...yyywwwwYYY...",
  "..yyywwwwwwYYY..",
  ".yyywwwwwwwwYYY.",
  ".YYwwwqqGGwwwYY.",
  ".YYwwwqGGGwwwYY.",
  ".YYwwwGGGGWWWYY.",
  ".YYwwwGGGGWWWYY.",
  ".ooowwwWWWWWooo.",
  "..ooowwWWWWooo..",
  "...ooowWWWooo...",
  "....oooooooo....",
  ".....oooooo.....",
  "................",
];

export const BRAND_GRIDS: Readonly<Record<TBrandGridName, TBrandGrid>> = {
  pencil: PENCIL_GRID,
  wordmark: WORDMARK_GRID,
  brandPencil: BRAND_PENCIL_GRID,
  pencilEnd: PENCIL_END_GRID,
};

export const BRAND_FIXED_COLORS: Readonly<Record<TBrandFixedKey, string>> = {
  y: "#F6C66E",
  Y: "#EDA743",
  o: "#C27A1E",
  w: "#F2D3A6",
  W: "#D6AA78",
  G: "#2A2C38",
  q: "#8A8D9C",
  s: "#1A1C24",
  m: "#D9D4C8",
  M: "#8E897E",
  e: "#E5868A",
  f: "#F2A7A9",
  E: "#B13E53",
};

/** Light-theme values of the theme keys, for generated images (which have no theme). */
export const BRAND_STATIC_THEME_COLORS: Readonly<Record<TBrandThemeKey, string>> = {
  d: "#1A1C24",
  i: "#1A1C24",
  h: "#B4500F",
};

/** Dark-theme values of the theme keys, for generated images shown on dark backgrounds. */
export const BRAND_DARK_STATIC_THEME_COLORS: Readonly<Record<TBrandThemeKey, string>> = {
  d: "#EFEBE5",
  i: "#EFEBE5",
  h: "#EDA743",
};

/** Logo pixels between the pencil and the wordmark in the horizontal lockup. */
const LOCKUP_GAP = 4;

/** Pencil, then the wordmark; both 7 pixels tall and top-aligned. */
export const HORIZONTAL_LOCKUP: readonly IBrandLockupPart[] = [
  { grid: PENCIL_GRID, x: 0, y: 0 },
  { grid: WORDMARK_GRID, x: PENCIL_GRID[0].length + LOCKUP_GAP, y: 0 },
];

export const BANNER_LOCKUP: readonly IBrandLockupPart[] = [{ grid: BRAND_PENCIL_GRID, x: 0, y: 0 }];

/** The 33 × 7 pencil alone. */
export const PENCIL_LOCKUP: readonly IBrandLockupPart[] = [{ grid: PENCIL_GRID, x: 0, y: 0 }];
