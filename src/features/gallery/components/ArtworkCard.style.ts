/**
 * Purpose:
 * Classes for the gallery ArtworkCard: card body, thumbnail link, title row, rename form and actions.
 */

import { focusRing } from "@/features/shared/components/focus.style";
import { cx } from "@/features/shared/utils/cx";

export const artworkCard = {
  body: "flex flex-col gap-1 p-3",
  thumbnailLink:
    "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-t-xl bg-surface-muted",
  frame: {
    base: "pixel-checkerboard relative max-h-full max-w-full",
    wide: "w-full",
    tall: "h-full",
  },
  thumbnail: "object-contain [image-rendering:pixelated]",
  renameForm: "flex gap-2",
  meta: "text-xs text-muted",
  size: "font-mono",
  titleRow: "flex items-center gap-2",
  titleLink: cx("min-w-0 flex-1 truncate rounded-sm font-medium text-fg", focusRing),
};
