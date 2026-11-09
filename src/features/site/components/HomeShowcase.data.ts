/**
 * Purpose:
 * Static parts of the Home live canvas: the toolbar's tools and the starter palette.
 *
 * Notes:
 * The swatch colors are artwork data (Sweetie 16, the palette every new artwork starts with), not
 * interface colors, so they are inline styles like the editor's own swatches.
 */

import { DEFAULT_PALETTE } from "@/features/shared/artwork/defaultPalette";
import { PUBLIC_ICONS } from "@/features/shared/constants/publicIcons";
import type { IShowcaseTool } from "./HomeShowcase.type";

export const SHOWCASE_TOOLS: IShowcaseTool[] = [
  { tool: "brush", icon: PUBLIC_ICONS.pencil },
  { tool: null, icon: PUBLIC_ICONS.eraser },
  { tool: "bucket", icon: PUBLIC_ICONS.bucket },
  { tool: null, icon: PUBLIC_ICONS.pipette },
  { tool: null, icon: PUBLIC_ICONS.pan },
];

export const SHOWCASE_SWATCH_STYLES = DEFAULT_PALETTE.map((color) => ({
  key: color,
  style: { backgroundColor: color },
}));

/** The lightest color, the secondary slot of every new artwork. */
export const SHOWCASE_SECONDARY = 1;
