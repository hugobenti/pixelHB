/**
 * Purpose:
 * Classes for AboutScreen: the reading layout, the two storage outcomes and the signed close.
 *
 * Notes:
 * One centered reading column: the whole page, outcomes and close included, shares the prose
 * measure, so nothing hangs off the left edge of the wide shell on desktop. The outcomes are open
 * rows under a hairline, like the home promises, not boxed cards; they sit side by side from `sm`.
 */

import { button } from "@/features/shared/components/Button.style";
import { siteType } from "@/features/shared/site/siteType.style";
import { cx } from "@/features/shared/utils/cx";

export const aboutScreen = {
  page: "mx-auto flex w-full max-w-xl flex-col gap-10",
  header: "flex flex-col gap-3",
  title: siteType.pageTitle,
  intro: cx(siteType.lead, "text-pretty"),
  section: "flex scroll-mt-24 flex-col gap-4",
  sectionTitle: siteType.section,
  /** The column already sets the measure. */
  prose: cx(siteType.prose, "max-w-none"),
  /** More room above the outcomes than inside them, so they read as one group. */
  outcomes: "mt-2 grid gap-6 sm:grid-cols-2 sm:gap-8",
  outcome: "flex flex-col gap-2 border-t border-line-strong pt-4",
  outcomeTitle: "text-base font-semibold text-fg",
  outcomeText: "text-base text-pretty text-fg-secondary",
  links: "flex flex-wrap gap-x-6 gap-y-2",
  link: siteType.linkStandalone,
  close: "flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-line pt-6",
  signature: "flex items-center gap-3 text-base font-semibold text-fg",
  closingCta: cx(button.base, button.size.default, button.variant.outline),
};
