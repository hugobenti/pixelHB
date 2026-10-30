/**
 * Purpose:
 * React access to the analytics choice: start PostHog on app load when consent was already given,
 * and read or change the choice from the banner and the Privacy page.
 *
 * Notes:
 * The server cannot know the stored choice, so `consent` is `undefined` until hydration; callers
 * render nothing for it, which keeps the banner from flashing for visitors who already chose.
 */
"use client";

import { useEffect, useSyncExternalStore } from "react";

import { analytics } from "./analytics";

/** Mount once (AppProviders): loads PostHog when consent was granted on an earlier visit. */
export function useAnalyticsStart(): void {
  useEffect(() => analytics.start(), []);
}

export function useAnalyticsConsent() {
  const consent = useSyncExternalStore(analytics.subscribe, analytics.getConsent, () => undefined);
  return { enabled: analytics.enabled, consent, setConsent: analytics.setConsent };
}
