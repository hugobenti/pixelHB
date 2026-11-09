/**
 * Purpose:
 * Classes for HelpScreen: the reading layout, table of contents, section subheads and shortcuts table.
 */

import { siteType } from "@/features/shared/site/siteType.style";

export const helpScreen = {
  page: "flex flex-col gap-10",
  header: "flex flex-col gap-3",
  title: siteType.pageTitle,
  intro: siteType.lead,
  toc: "flex flex-wrap gap-x-5 gap-y-2",
  section: "flex scroll-mt-24 flex-col gap-4",
  sectionTitle: siteType.section,
  /** More room above a subhead than below it, so each block reads as its own group. */
  subsection: "mt-2 flex scroll-mt-24 flex-col gap-3",
  subsectionTitle: "text-base font-semibold text-fg",
  prose: siteType.prose,
  link: siteType.link,
  tocLink: siteType.linkStandalone,
  tableWrap: "overflow-x-auto",
  table: "w-full max-w-prose border-collapse text-left text-base",
  headCell: "border-b border-control-border py-2 pr-4 text-sm font-semibold text-muted",
  cell: "border-b border-control-border py-3 pr-4 align-top text-fg-secondary",
  keys: "rounded-sm border border-control-border px-1.5 font-mono text-xs text-fg",
  note: "ml-2 text-xs text-muted",
};
