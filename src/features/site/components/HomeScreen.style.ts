/**
 * Purpose:
 * Classes for HomeScreen: hero, promises, the editor's tools, steps, storage band and closing call.
 *
 * Notes:
 * Promises and tools are open rows separated by hairlines, not boxed cards: the hero's editor
 * illustration is the one framed object on the page.
 */

import { button } from "@/features/shared/components/Button.style";
import { siteType } from "@/features/shared/site/siteType.style";
import { cx } from "@/features/shared/utils/cx";

export const homeScreen = {
  page: "flex flex-col gap-12 sm:gap-16",
  hero: "grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14",
  heroText: "flex flex-col items-start gap-6",
  title: cx(siteType.display, "text-balance"),
  lead: cx(siteType.lead, "max-w-xl text-pretty"),
  actions: "flex flex-wrap gap-3",
  primary: cx(button.base, button.size.default, button.variant.primary),
  secondary: cx(button.base, button.size.default, button.variant.outline),
  promises: "grid gap-6 sm:grid-cols-3 sm:gap-8",
  promise: "flex flex-col gap-2 border-t border-line-strong pt-5",
  promiseIcon: "size-6 text-fg-soft",
  cardTitle: "text-base font-semibold text-fg",
  cardText: "text-sm text-muted",
  section: "flex flex-col gap-4",
  sectionTitle: siteType.section,
  sectionIntro: "text-sm text-muted sm:text-base",
  features: "grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4",
  feature: "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1",
  featureIcon: "row-span-2 mt-0.5 size-5 text-fg-soft",
  featureTitle: "text-sm font-semibold text-fg sm:text-base",
  featureText: "text-sm text-muted",
  steps: "flex flex-col gap-6 sm:grid sm:grid-cols-3 sm:gap-0",
  step: "relative flex items-start gap-4 after:absolute after:top-11 after:-bottom-6 after:left-[22px] after:border-l after:border-dashed after:border-line-strong last:after:hidden sm:flex-col sm:items-center sm:gap-3 sm:px-3 sm:text-center sm:after:top-[22px] sm:after:bottom-auto sm:after:left-1/2 sm:after:h-0 sm:after:w-full sm:after:border-t sm:after:border-l-0",
  stepNumber:
    "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-lg border border-line bg-surface font-mono text-lg font-semibold text-accent",
  stepBody: "flex flex-col gap-1",
  note: "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface px-5 py-4 text-sm text-muted",
  noteLink: siteType.linkStandalone,
  closing:
    "flex flex-col items-center gap-4 rounded-xl border border-line bg-surface px-6 py-12 text-center",
  closingTitle: cx(siteType.section, "sm:text-2xl"),
  closingText: "text-sm text-muted sm:text-base",
};
