/**
 * Purpose:
 * About page: what PixelHB is, the principle that the art belongs to the artist, the maker's story and the
 * source code link.
 */

import Link from "next/link";

import { about } from "@/content/about";
import { site } from "@/content/site";
import { aboutScreen } from "./AboutScreen.style";

export function AboutScreen() {
  return (
    <div className={aboutScreen.page}>
      <header className={aboutScreen.header}>
        <h1 className={aboutScreen.title}>{about.h1}</h1>
        <p className={aboutScreen.intro}>{about.intro}</p>
      </header>

      {about.sections.map((section) => (
        <section key={section.id} id={section.id} className={aboutScreen.section}>
          <h2 className={aboutScreen.sectionTitle}>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className={aboutScreen.prose}>
              {paragraph}
            </p>
          ))}
          {section.id === "why" && (
            <>
              <p className={aboutScreen.prose}>
                <Link href="/contact" className={aboutScreen.link}>
                  {about.feedbackLink}
                </Link>
              </p>
              <p className={aboutScreen.signature}>{about.signature}</p>
            </>
          )}
          {section.id === "ownership" && (
            <p className={aboutScreen.prose}>
              <Link href="/privacy" className={aboutScreen.link}>
                {about.privacyLink}
              </Link>
            </p>
          )}
          {section.id === "source" && (
            <p className={aboutScreen.prose}>
              <a href={site.repoUrl} className={aboutScreen.link}>
                {about.githubLink}
              </a>
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
