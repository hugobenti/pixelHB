/**
 * Purpose:
 * Classes for AboutScreen: the reading layout, the two storage outcomes and the signed close.
 *
 * Notes:
 * The outcomes are open rows under a hairline, like the home promises, not boxed cards. They run a
 * little wider than the prose so the two sit side by side from `sm`.
 */

import { button } from "@/features/shared/components/Button.style";
import { siteType } from "@/features/shared/site/siteType.style";
import { cx } from "@/features/shared/utils/cx";

export const aboutScreen = {
  page: "flex flex-col gap-10",
  header: "flex flex-col gap-3",
  title: siteType.pageTitle,
  intro: cx(siteType.lead, "max-w-2xl text-pretty"),
  section: "flex scroll-mt-24 flex-col gap-4",
  sectionTitle: siteType.section,
  prose: siteType.prose,
  /** More room above the outcomes than inside them, so they read as one group. */
  outcomes: "mt-2 grid max-w-3xl gap-6 sm:grid-cols-2 sm:gap-8",
  outcome: "flex flex-col gap-2 border-t border-line-strong pt-4",
  outcomeTitle: "text-base font-semibold text-fg",
  outcomeText: "text-base text-pretty text-fg-secondary",
  links: "flex flex-wrap gap-x-6 gap-y-2",
  link: siteType.linkStandalone,
  close:
    "flex max-w-lg flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-line pt-6",
  signature: "flex items-center gap-3 text-base font-semibold text-fg",
  closingCta: cx(button.base, button.size.default, button.variant.outline),
};
