/**
 * Purpose:
 * Privacy page: where artworks are stored, what PixelHB can access in Google Drive, the analytics
 * it collects (with the switch to change that choice) and how to disconnect it.
 */

import Link from "next/link";

import { privacy } from "@/content/privacy";
import { AnalyticsPreference } from "@/features/shared/analytics/AnalyticsPreference";
import { privacyScreen } from "./PrivacyScreen.style";

export function PrivacyScreen() {
  return (
    <div className={privacyScreen.page}>
      <header className={privacyScreen.header}>
        <h1 className={privacyScreen.title}>{privacy.h1}</h1>
        <p className={privacyScreen.intro}>{privacy.intro}</p>
        <p className={privacyScreen.updated}>{privacy.updated}</p>
      </header>

      {privacy.sections.map((section) => (
        <section key={section.id} id={section.id} className={privacyScreen.section}>
          <h2 className={privacyScreen.sectionTitle}>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className={privacyScreen.prose}>
              {paragraph}
            </p>
          ))}
          {section.id === "analytics" && (
            <AnalyticsPreference className={privacyScreen.analyticsSwitch} />
          )}
          {section.id === "revoke" && (
            <p className={privacyScreen.prose}>
              <a href={privacy.revokeLink.href} className={privacyScreen.link}>
                {privacy.revokeLink.label}
              </a>
            </p>
          )}
          {section.id === "contact" && (
            <p className={privacyScreen.prose}>
              <Link href="/contact" className={privacyScreen.link}>
                {privacy.contactLink}
              </Link>
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
