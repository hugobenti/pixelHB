/**
 * Purpose:
 * Table of contents of the Help page: one anchor per section with its subsections under it, then the
 * shortcuts.
 */

import { help } from "@/content/help";
import type { IHelpTocEntry } from "./HelpScreen.type";

export const SHORTCUTS_ID = "shortcuts";

export const HELP_TOC: IHelpTocEntry[] = [
  ...help.sections.map(({ id, title, subsections = [] }) => ({
    href: `#${id}`,
    title,
    children: subsections.map((subsection) => ({
      href: `#${subsection.id}`,
      title: subsection.title,
    })),
  })),
  { href: `#${SHORTCUTS_ID}`, title: help.shortcutsTitle, children: [] },
];
