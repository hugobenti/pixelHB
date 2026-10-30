/**
 * Purpose:
 * The app's analytics instance and its typed `capture(event, props)` helper.
 *
 * Notes:
 * `NEXT_PUBLIC_POSTHOG_KEY` is inlined at build time; left empty, analytics is off. posthog-js is
 * imported dynamically, so its script is only downloaded after the visitor grants consent. Outside
 * the browser (server, tests) storage reads fail and read as "no choice", so `capture` is a no-op.
 */
import type { IConsentStorage } from "./analytics.type";
import { createAnalyticsController } from "./analyticsController";
import { POSTHOG_OPTIONS } from "./posthogOptions";

const browserStorage: IConsentStorage = {
  get: (key) => window.localStorage.getItem(key),
  set: (key, value) => window.localStorage.setItem(key, value),
};

export const analytics = createAnalyticsController({
  token: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  storage: browserStorage,
  load: async (token) => {
    // Dynamic on purpose: the PostHog bundle is fetched only after consent, never on a plain visit.
    const { default: posthog } = await import("posthog-js");
    posthog.init(token, POSTHOG_OPTIONS);
    return posthog;
  },
});

/** Sends a product event; does nothing without a token or without the visitor's consent. */
export const capture = analytics.capture;
