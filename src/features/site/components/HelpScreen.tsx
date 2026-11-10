/**
 * Purpose:
 * Help page: table of contents, how-to sections, the grouped keyboard shortcuts table and a closing
 * row with a way to report problems and a way back to drawing.
 */

import Link from "next/link";

import { help } from "@/content/help";
import { ShortcutKeys } from "@/features/shared/components/ShortcutKeys";
import { HELP_TOC, SHORTCUTS_ID } from "./HelpScreen.data";
import { helpScreen } from "./HelpScreen.style";

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
            <li key={entry.href} className={helpScreen.tocItem}>
              <a href={entry.href} className={helpScreen.tocLink}>
                {entry.title}
              </a>
              {entry.children.length > 0 && (
                <ul className={helpScreen.tocChildren}>
                  {entry.children.map((child) => (
                    <li key={child.href}>
                      <a href={child.href} className={helpScreen.tocChildLink}>
                        {child.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
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
          {section.subsections?.map((subsection) => (
            <section key={subsection.id} id={subsection.id} className={helpScreen.subsection}>
              <h3 className={helpScreen.subsectionTitle}>{subsection.title}</h3>
              {subsection.note && (
                <div className={helpScreen.note}>
                  <p className={helpScreen.noteTitle}>{subsection.note.title}</p>
                  <p className={helpScreen.noteText}>{subsection.note.text}</p>
                </div>
              )}
              {subsection.paragraphs.map((paragraph) => (
                <p key={paragraph} className={helpScreen.prose}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
          {section.links && (
            <p className={helpScreen.links}>
              {section.links.map((link) => (
                <Link key={link.href} href={link.href} className={helpScreen.standaloneLink}>
                  {link.label}
                </Link>
              ))}
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
            {help.shortcutGroups.map((group) => (
              <tbody key={group.title}>
                <tr>
                  <th scope="rowgroup" colSpan={2} className={helpScreen.groupCell}>
                    {group.title}
                  </th>
                </tr>
                {group.shortcuts.map((shortcut) => (
                  <tr key={shortcut.effect}>
                    <th scope="row" className={helpScreen.cell}>
                      {shortcut.action}
                    </th>
                    <td className={helpScreen.cell}>
                      <ShortcutKeys combo={shortcut.combo} />
                      {shortcut.note && <span className={helpScreen.keyNote}>{shortcut.note}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <div className={helpScreen.close}>
        <p className={helpScreen.closeText}>
          {help.contactPrompt}{" "}
          <Link href="/contact" className={helpScreen.link}>
            {help.contactLink}
          </Link>
        </p>
        <Link href={help.closingCta.href} className={helpScreen.closingCta}>
          {help.closingCta.label}
        </Link>
      </div>
    </div>
  );
}
