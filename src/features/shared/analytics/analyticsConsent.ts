/**
 * Purpose:
 * The visitor's analytics choice ("granted" | "denied", or none yet) and where it is kept.
 *
 * Notes:
 * Storage errors (private mode, blocked storage) read as "no choice" and are swallowed on write:
 * without storage PostHog is never loaded on a later visit, which is the safe side.
 */
import type { IConsentStorage, TAnalyticsConsent } from "./analytics.type";

export const ANALYTICS_CONSENT_KEY = "pixelhb.analyticsConsent";

export function parseAnalyticsConsent(raw: string | null): TAnalyticsConsent {
  return raw === "granted" || raw === "denied" ? raw : null;
}

export function readAnalyticsConsent(storage: IConsentStorage): TAnalyticsConsent {
  try {
    return parseAnalyticsConsent(storage.get(ANALYTICS_CONSENT_KEY));
  } catch {
    return null;
  }
}

export function writeAnalyticsConsent(
  storage: IConsentStorage,
  choice: "granted" | "denied",
): void {
  try {
    storage.set(ANALYTICS_CONSENT_KEY, choice);
  } catch {
    // Storage unavailable: the choice holds for this page view only.
  }
}
