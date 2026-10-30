/**
 * Purpose:
 * Non-modal analytics consent banner: what is collected, a link to the Privacy page, and Decline /
 * Accept at equal prominence. Renders nothing without a PostHog key or once the visitor has chosen.
 */
"use client";

import Link from "next/link";

import { shared } from "@/content/shared";
import { Button } from "@/features/shared/components/Button";
import { consentBanner } from "./AnalyticsConsentBanner.style";
import { useAnalyticsConsentBanner } from "./useAnalyticsConsentBanner";

export function AnalyticsConsentBanner() {
  const { visible, bannerRef, accept, decline } = useAnalyticsConsentBanner();
  const copy = shared.analytics;

  if (!visible) {
    return null;
  }

  return (
    <section ref={bannerRef} aria-label={copy.bannerLabel} className={consentBanner.region}>
      <div className={consentBanner.inner}>
        <p className={consentBanner.text}>
          {copy.bannerText}{" "}
          <Link href="/privacy#analytics" className={consentBanner.link}>
            {copy.privacyLink}
          </Link>
        </p>
        <div className={consentBanner.actions}>
          <Button variant="outline" onClick={decline} className={consentBanner.action}>
            {copy.decline}
          </Button>
          <Button variant="outline" onClick={accept} className={consentBanner.action}>
            {copy.accept}
          </Button>
        </div>
      </div>
    </section>
  );
}
