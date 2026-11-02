/**
 * Purpose:
 * Classes for the ActiveLayerChip: an outlined 40px button (44px on coarse pointers) holding a
 * 24px checkerboard well with the layer preview and the truncated layer name.
 */

import { focusRing } from "@/features/shared/components/focus.style";
import { pressedState } from "@/features/shared/components/pressedState.style";
import { cx } from "@/features/shared/utils/cx";

export const activeLayerChip = {
  base: cx(
    "inline-flex h-10 min-w-10 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-lg border border-control-border bg-surface py-0 pr-2 pl-2 text-sm text-fg lg:min-w-0 lg:pr-2.5 pointer-coarse:h-11 pointer-coarse:min-w-11",
    "transition-colors hover:bg-surface-muted",
    focusRing,
    pressedState,
  ),
  well: "pixel-checkerboard [--checker-size:6px] [&_img]:shadow-none [&_img]:[image-rendering:pixelated] flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm ring-1 ring-line-strong ring-inset",
  /** Preview only below `lg` (the top row also holds the tools from `md`); the name stays in the accessible name. */
  layerName: "sr-only lg:not-sr-only lg:max-w-[14ch] lg:truncate",
};
