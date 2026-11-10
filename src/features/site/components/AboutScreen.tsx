/**
 * Purpose:
 * About page: what PixelHB is, where an artwork lives signed out and signed in, why it exists, and
 * the maker's signature with a way back to drawing.
 */

import Link from "next/link";

import { about } from "@/content/about";
import { BrandLogo } from "@/features/shared/brand/BrandLogo";
import { aboutScreen } from "./AboutScreen.style";

export function AboutScreen() {
  const { ownership, story } = about;
  return (
    <div className={aboutScreen.page}>
      <header className={aboutScreen.header}>
        <h1 className={aboutScreen.title}>{about.h1}</h1>
        <p className={aboutScreen.intro}>{about.intro}</p>
      </header>

      <section id={ownership.id} className={aboutScreen.section}>
        <h2 className={aboutScreen.sectionTitle}>{ownership.title}</h2>
        {ownership.paragraphs.map((paragraph) => (
          <p key={paragraph} className={aboutScreen.prose}>
            {paragraph}
          </p>
        ))}
        <ul className={aboutScreen.outcomes}>
          {ownership.outcomes.map((outcome) => (
            <li key={outcome.title} className={aboutScreen.outcome}>
              <h3 className={aboutScreen.outcomeTitle}>{outcome.title}</h3>
              {outcome.paragraphs.map((paragraph) => (
                <p key={paragraph} className={aboutScreen.outcomeText}>
                  {paragraph}
                </p>
              ))}
            </li>
          ))}
        </ul>
        <p className={aboutScreen.prose}>{ownership.exports}</p>
        <p className={aboutScreen.links}>
          {ownership.links.map((link) => (
            <Link key={link.href} href={link.href} className={aboutScreen.link}>
              {link.label}
            </Link>
          ))}
        </p>
      </section>

      <section id={story.id} className={aboutScreen.section}>
        <h2 className={aboutScreen.sectionTitle}>{story.title}</h2>
        {story.paragraphs.map((paragraph) => (
          <p key={paragraph} className={aboutScreen.prose}>
            {paragraph}
          </p>
        ))}
        <p className={aboutScreen.links}>
          {story.links.map((link) =>
            link.external ? (
              <a key={link.href} href={link.href} className={aboutScreen.link}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className={aboutScreen.link}>
                {link.label}
              </Link>
            ),
          )}
        </p>
      </section>

      <div className={aboutScreen.close}>
        <p className={aboutScreen.signature}>
          <BrandLogo variant="icon" decorative />
          {about.signature}
        </p>
        <Link href={about.closingCta.href} className={aboutScreen.closingCta}>
          {about.closingCta.label}
        </Link>
      </div>
    </div>
  );
}
