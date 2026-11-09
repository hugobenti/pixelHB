/**
 * Purpose:
 * Home page: hero with the editor illustration, the three promises, the editor's tools, how it
 * works, the storage note and the closing call to action.
 */

import Link from "next/link";

import { home } from "@/content/home";
import { BrandLogo } from "@/features/shared/brand/BrandLogo";
import { PublicMaskIcon } from "@/features/shared/components/PublicMaskIcon";
import { HOME_FEATURE_ICONS, HOME_PROMISE_ICONS, HOME_STEP_NUMBERS } from "./HomeScreen.data";
import { homeScreen } from "./HomeScreen.style";
import { HomeShowcase } from "./HomeShowcase";

export function HomeScreen() {
  return (
    <div className={homeScreen.page}>
      <section className={homeScreen.hero}>
        <div className={homeScreen.heroText}>
          <h1 className={homeScreen.title}>{home.h1}</h1>
          <p className={homeScreen.lead}>{home.lead}</p>
          <div className={homeScreen.actions}>
            <Link href="/gallery" className={homeScreen.primary}>
              {home.primary}
            </Link>
            <Link href="/help" className={homeScreen.secondary}>
              {home.secondary}
            </Link>
          </div>
        </div>
        <HomeShowcase />
      </section>

      <section className={homeScreen.promises}>
        {home.promises.map((promise, index) => (
          <div key={promise.title} className={homeScreen.promise}>
            <PublicMaskIcon src={HOME_PROMISE_ICONS[index]} className={homeScreen.promiseIcon} />
            <h2 className={homeScreen.cardTitle}>{promise.title}</h2>
            <p className={homeScreen.cardText}>{promise.text}</p>
          </div>
        ))}
      </section>

      <section className={homeScreen.section}>
        <h2 className={homeScreen.sectionTitle}>{home.insideLabel}</h2>
        <p className={homeScreen.sectionIntro}>{home.insideIntro}</p>
        <ul className={homeScreen.features}>
          {home.inside.map((item, index) => (
            <li key={item.title} className={homeScreen.feature}>
              <PublicMaskIcon src={HOME_FEATURE_ICONS[index]} className={homeScreen.featureIcon} />
              <h3 className={homeScreen.featureTitle}>{item.title}</h3>
              <p className={homeScreen.featureText}>{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={homeScreen.section}>
        <h2 className={homeScreen.sectionTitle}>{home.stepsTitle}</h2>
        <ol className={homeScreen.steps}>
          {home.steps.map((step, index) => (
            <li key={step.title} className={homeScreen.step}>
              <span aria-hidden="true" className={homeScreen.stepNumber}>
                {HOME_STEP_NUMBERS[index]}
              </span>
              <div className={homeScreen.stepBody}>
                <h3 className={homeScreen.cardTitle}>{step.title}</h3>
                <p className={homeScreen.cardText}>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className={homeScreen.note}>
        {home.storageNote}
        <Link href="/help#saving" className={homeScreen.noteLink}>
          {home.storageLink}
        </Link>
      </p>

      <section className={homeScreen.closing}>
        <BrandLogo variant="pencil" decorative />
        <h2 className={homeScreen.closingTitle}>{home.closingTitle}</h2>
        <p className={homeScreen.closingText}>{home.closingText}</p>
        <Link href="/gallery" className={homeScreen.primary}>
          {home.closingCta}
        </Link>
      </section>
    </div>
  );
}
