/**
 * Purpose:
 * Terms page: the plain rules for using PixelHB, in the Privacy page's reading layout.
 */

import Link from "next/link";

import { terms } from "@/content/terms";
import { privacyScreen } from "./PrivacyScreen.style";

export function TermsScreen() {
  return (
    <div className={privacyScreen.page}>
      <header className={privacyScreen.header}>
        <h1 className={privacyScreen.title}>{terms.h1}</h1>
        <p className={privacyScreen.intro}>{terms.intro}</p>
        <p className={privacyScreen.updated}>{terms.updated}</p>
      </header>

      {terms.sections.map((section) => (
        <section key={section.id} id={section.id} className={privacyScreen.section}>
          <h2 className={privacyScreen.sectionTitle}>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className={privacyScreen.prose}>
              {paragraph}
            </p>
          ))}
          {section.link && (
            <p className={privacyScreen.prose}>
              <Link href={section.link.href} className={privacyScreen.link}>
                {section.link.label}
              </Link>
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
