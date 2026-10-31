/**
 * Purpose:
 * Classes for a SortableLayerItem row: drag handle, select button with preview and name, icon actions (IconButton).
 */

import { focusRing } from "@/features/shared/components/focus.style";
import { cx } from "@/features/shared/utils/cx";

export const sortableLayerItem = {
  wrap: "motion-reduce:transition-none!",
  row: "flex w-full flex-wrap sm:flex-nowrap min-w-0 items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors sm:gap-3 sm:px-3",
  rowState: {
    active: "border-accent bg-surface-muted",
    idle: "border-line bg-surface hover:bg-surface-subtle",
  },
  dragHandle: cx(
    "flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted active:cursor-grabbing pointer-coarse:h-11",
    focusRing,
  ),
  srOnly: "sr-only",
  selectButton: cx(
    "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md text-left sm:gap-3",
    focusRing,
  ),
  previewWrap:
    "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line-strong bg-surface-muted sm:h-14 sm:w-14",
  metadata: "min-w-0 flex-1",
  layerName: "block min-w-0 truncate text-sm font-semibold text-fg",
  actions: "ml-auto flex w-full justify-end sm:w-auto shrink-0 items-center gap-1 sm:gap-2",
};
