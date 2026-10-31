/**
 * Purpose:
 * Classes for the ColorPairChip: an outlined 40px button (44px on coarse pointers) holding two
 * overlapping 20px color squares, the active one in front at the top-left.
 */

import { focusRing } from "@/features/shared/components/focus.style";
import { cx } from "@/features/shared/utils/cx";

export const colorPairChip = {
  base: cx(
    "inline-flex h-10 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-control-border bg-surface p-0 text-fg pointer-coarse:h-11",
    "transition-colors hover:bg-surface-muted",
    focusRing,
  ),
  /** 32px box: 20px squares overlapping by 8px. */
  stack: "relative block size-8",
  square: "absolute block size-5 rounded-sm ring-1 ring-control-border",
  front: "top-0 left-0 z-10",
  back: "right-0 bottom-0",
};
