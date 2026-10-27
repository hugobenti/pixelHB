/**
 * Purpose:
 * Classes for AccountControl: the placement wrappers, the avatar button, the popover panel and the
 * account details.
 */

import { focusRing } from "@/features/shared/components/focus.style";
import { cx } from "@/features/shared/utils/cx";

export const accountControl = {
  placement: {
    bar: "hidden sm:block relative",
    sheet: "mt-2 border-t border-line pt-4",
  },
  /** Holds the avatar's space while the session loads, so the header does not jump. */
  placeholder: "invisible size-10 pointer-coarse:size-11",
  avatar: cx(
    "inline-flex size-10 touch-manipulation items-center justify-center rounded-full border border-line-strong bg-surface-muted text-sm font-semibold text-fg transition-colors hover:bg-surface-strong pointer-coarse:size-11",
    focusRing,
  ),
  signIn: {
    bar: "shrink-0",
    sheet: "min-h-12 w-full",
  },
  panel:
    "absolute right-0 top-full z-50 mt-1 flex w-72 flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-lg",
  sheetSection: "flex flex-col gap-3",
  heading: "text-sm font-semibold text-muted",
  details: "flex flex-col gap-3",
  identity: "flex min-w-0 flex-col",
  userName: "truncate text-sm font-medium text-fg",
  userEmail: "truncate text-sm text-muted",
  note: "text-sm text-muted",
  action: {
    bar: "w-full",
    sheet: "min-h-12 w-full",
  },
};
