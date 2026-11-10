/**
 * Purpose:
 * Classes for HelpScreen: the reading layout, table of contents, section subheads, the shared-computer
 * note, the grouped shortcuts table and the closing row.
 *
 * Notes:
 * One centered reading column, like About: everything shares the prose measure, so nothing hangs off
 * the left edge of the wide shell on desktop. The table of contents runs in two columns from `sm`,
 * each section kept whole with its subsections indented under it.
 */

import { button } from "@/features/shared/components/Button.style";
import { siteType } from "@/features/shared/site/siteType.style";
import { cx } from "@/features/shared/utils/cx";

export const helpScreen = {
  page: "mx-auto flex w-full max-w-xl flex-col gap-10",
  header: "flex flex-col gap-3",
  title: siteType.pageTitle,
  intro: cx(siteType.lead, "text-pretty"),
  toc: "gap-x-8 sm:columns-2",
  tocItem: "mb-2 break-inside-avoid",
  tocChildren: "mt-1 flex flex-col gap-1 border-l border-line pl-3 text-pretty",
  tocLink: siteType.linkStandalone,
  tocChildLink: cx(siteType.linkStandalone, "text-sm text-fg-secondary"),
  section: "flex scroll-mt-24 flex-col gap-4",
  sectionTitle: siteType.section,
  /** More room above a subhead than below it, so each block reads as its own group. */
  subsection: "mt-2 flex scroll-mt-24 flex-col gap-3",
  subsectionTitle: "text-base font-semibold text-fg",
  /** The column already sets the measure; `text-pretty` keeps single words off the last line. */
  prose: cx(siteType.prose, "max-w-none text-pretty"),
  note: "flex flex-col gap-1 rounded-lg border border-line-strong bg-surface px-4 py-3",
  noteTitle: "text-sm font-semibold text-fg",
  noteText: "text-sm text-fg-secondary",
  links: "flex flex-wrap gap-x-6 gap-y-2",
  link: siteType.link,
  standaloneLink: siteType.linkStandalone,
  tableWrap: "overflow-x-auto",
  table: "w-full border-collapse text-left text-base",
  headCell: "border-b border-control-border py-2 pr-4 text-sm font-semibold text-muted",
  /** Group rows carry the weight; action rows stay regular so the groups read first. */
  groupCell: "pt-6 pb-2 text-sm font-semibold text-fg",
  cell: "border-b border-control-border py-3 pr-4 align-top font-normal text-fg-secondary",
  keyNote: "ml-2 text-xs text-muted",
  close: "flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-line pt-6",
  closeText: "text-base text-fg-secondary",
  closingCta: cx(button.base, button.size.default, button.variant.outline),
};
