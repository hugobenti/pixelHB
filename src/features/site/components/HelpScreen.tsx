/**
 * Purpose:
 * Help page: table of contents, how-to sections, the keyboard shortcuts table and a way to report problems.
 */

import Link from "next/link";

import { help } from "@/content/help";
import { HELP_TOC, SHORTCUTS_ID } from "./HelpScreen.data";
import { helpScreen } from "./HelpScreen.style";
import { ShortcutKeys } from "./ShortcutKeys";

export function HelpScreen() {
  return (
    <div className={helpScreen.page}>
      <header className={helpScreen.header}>
        <h1 className={helpScreen.title}>{help.h1}</h1>
        <p className={helpScreen.intro}>{help.intro}</p>
      </header>

      <nav aria-label={help.tocLabel}>
        <ul className={helpScreen.toc}>
          {HELP_TOC.map((entry) => (
            <li key={entry.href}>
              <a href={entry.href} className={helpScreen.tocLink}>
                {entry.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {help.sections.map((section) => (
        <section key={section.id} id={section.id} className={helpScreen.section}>
          <h2 className={helpScreen.sectionTitle}>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className={helpScreen.prose}>
              {paragraph}
            </p>
          ))}
          {section.id === "saving" && (
            <p className={helpScreen.prose}>
              <Link href="/privacy" className={helpScreen.link}>
                {help.privacyLink}
              </Link>
            </p>
          )}
        </section>
      ))}

      <section id={SHORTCUTS_ID} className={helpScreen.section}>
        <h2 className={helpScreen.sectionTitle}>{help.shortcutsTitle}</h2>
        <p className={helpScreen.prose}>{help.shortcutsIntro}</p>
        <div className={helpScreen.tableWrap}>
          <table className={helpScreen.table}>
            <thead>
              <tr>
                <th scope="col" className={helpScreen.headCell}>
                  {help.shortcutColumns.action}
                </th>
                <th scope="col" className={helpScreen.headCell}>
                  {help.shortcutColumns.keys}
                </th>
              </tr>
            </thead>
            <tbody>
              {help.shortcuts.map((shortcut) => (
                <tr key={shortcut.effect}>
                  <th scope="row" className={helpScreen.cell}>
                    {shortcut.action}
                  </th>
                  <td className={helpScreen.cell}>
                    <ShortcutKeys combo={shortcut.combo} />
                    {shortcut.note && <span className={helpScreen.note}>{shortcut.note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className={helpScreen.prose}>
        {help.contactPrompt}{" "}
        <Link href="/contact" className={helpScreen.link}>
          {help.contactLink}
        </Link>
      </p>
    </div>
  );
}
