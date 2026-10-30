/**
 * Purpose:
 * Classes for the analytics consent banner: a full-width sheet fixed to the bottom of the window,
 * text and privacy link on the left (above on phones), Decline and Accept at equal weight.
 */

import { siteType } from "@/features/shared/site/siteType.style";
import { cx } from "@/features/shared/utils/cx";

export const consentBanner = {
  region: cx(
    "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface shadow-lg",
    "pb-[env(safe-area-inset-bottom)]",
  ),
  inner:
    "mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4",
  text: "min-w-0 flex-1 text-sm text-fg-secondary",
  link: siteType.link,
  actions: "flex shrink-0 gap-2",
  action: "flex-1 sm:flex-none",
};
