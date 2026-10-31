/**
 * Purpose:
 * Classes for the EditorActionsBar: top row, back link (chevron + label) and title cluster, sync status and the action cluster.
 */

import { focusRing } from "@/features/shared/components/focus.style";
import { cx } from "@/features/shared/utils/cx";

export const editorActionsBar = {
  bar: "flex items-center gap-2 [grid-area:title] sm:flex-wrap sm:py-2",
  leftCluster: "flex min-w-0 flex-1 flex-wrap items-center gap-x-3 sm:min-w-32 sm:flex-nowrap",
  actions: "flex shrink-0 items-center justify-end gap-0.5 sm:gap-1 lg:gap-2",
  /** Icon + label link with a 40px target (44px on coarse pointers); the negative margin keeps the label on the page edge. */
  backLink: cx(
    "-ml-2 inline-flex min-h-10 min-w-10 shrink-0 touch-manipulation items-center justify-center gap-1 rounded-lg px-2 text-sm font-medium text-fg-soft transition-colors pointer-coarse:min-h-11 pointer-coarse:min-w-11",
    "hover:bg-surface-muted",
    focusRing,
  ),
  /** Chevron only below `lg` (the label stays in the accessible name), so the title keeps room. */
  backLabel: "sr-only lg:not-sr-only",
  heading:
    "min-w-0 flex-1 basis-0 truncate text-base font-semibold text-fg sm:flex-initial sm:basis-auto",
  /** Sync status after the title; below `sm` only the attention tone stays, so saving never wraps the toolbar; the attention text takes its own row there. */
  status: {
    neutral: "hidden shrink-0 text-xs text-muted sm:block",
    progress: "hidden shrink-0 text-xs text-muted sm:block",
    attention: "basis-full text-xs font-medium text-fg sm:shrink-0 sm:basis-auto",
  },
};
