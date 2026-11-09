/**
 * Purpose:
 * What the Home hero's editor illustration shows: the sample sprite, the toolbar tools and the
 * starter palette with its painting slots.
 *
 * Notes:
 * The swatch colors are artwork data (Sweetie 16, the palette every new artwork starts with), not
 * interface colors, so they are inline styles like the editor's own swatches.
 */

import { DEFAULT_PALETTE } from "@/features/shared/artwork/defaultPalette";
import { PUBLIC_ICONS } from "@/features/shared/constants/publicIcons";
import type { IShowcaseSwatch, IShowcaseTool } from "./HomeShowcase.type";

/** An illustrative 32 × 32 sprite drawn with the starter palette only (`public/showcase/slime.png`). */
export const SHOWCASE_SPRITE = { src: "/showcase/slime.png", width: 32, height: 32 };

export const SHOWCASE_TOOLS: IShowcaseTool[] = [
  { icon: PUBLIC_ICONS.pencil, pressed: true },
  { icon: PUBLIC_ICONS.eraser, pressed: false },
  { icon: PUBLIC_ICONS.bucket, pressed: false },
  { icon: PUBLIC_ICONS.pipette, pressed: false },
  { icon: PUBLIC_ICONS.pan, pressed: false },
];

/** The slime's body green paints; the lightest color sits in the other slot, as in a new artwork. */
const PRIMARY_INDEX = 7;
const SECONDARY_INDEX = 1;

export const SHOWCASE_SWATCHES: IShowcaseSwatch[] = DEFAULT_PALETTE.map((color, index) => ({
  key: color,
  style: { backgroundColor: color },
  ring: index === PRIMARY_INDEX ? "primary" : index === SECONDARY_INDEX ? "secondary" : "idle",
}));

export const SHOWCASE_COLOR_PAIR = {
  primary: { backgroundColor: DEFAULT_PALETTE[PRIMARY_INDEX] },
  secondary: { backgroundColor: DEFAULT_PALETTE[SECONDARY_INDEX] },
};
