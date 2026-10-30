/**
 * Purpose:
 * Consent-gated analytics: holds the visitor's choice, loads PostHog only once it is "granted", and
 * turns every capture into a no-op otherwise.
 *
 * Notes:
 * No token means analytics is off: no banner, no script, nothing stored. PostHog keeps its own
 * opt-out flag, and `reset()` clears it, so a withdrawal resets first and opts out last; a later
 * grant (this page view or a later visit) opts back in. Never calls `identify`: everyone stays
 * anonymous.
 */
import type {
  IAnalyticsClient,
  IAnalyticsController,
  IAnalyticsControllerDeps,
  TAnalyticsConsent,
} from "./analytics.type";
import { readAnalyticsConsent, writeAnalyticsConsent } from "./analyticsConsent";

function optIn(client: IAnalyticsClient): void {
  client.opt_in_capturing({ captureEventName: false });
  client.startSessionRecording();
}

function withdraw(client: IAnalyticsClient): void {
  client.stopSessionRecording();
  client.reset();
  client.opt_out_capturing();
}

export function createAnalyticsController(deps: IAnalyticsControllerDeps): IAnalyticsController {
  const token = deps.token?.trim() ?? "";
  const enabled = token !== "";
  const listeners = new Set<() => void>();
  /** `undefined` until first read: storage is only touched in the browser. */
  let consent: TAnalyticsConsent | undefined;
  let client: IAnalyticsClient | null = null;
  let loading: Promise<void> | null = null;

  function getConsent(): TAnalyticsConsent {
    if (!enabled) return null;
    consent ??= readAnalyticsConsent(deps.storage);
    return consent;
  }

  function ensureLoaded(): Promise<void> {
    loading ??= deps.load(token).then(
      (loaded) => {
        client = loaded;
        if (getConsent() !== "granted") withdraw(loaded);
        else if (loaded.has_opted_out_capturing()) optIn(loaded);
      },
      () => {
        // Blocked or offline: nothing is sent; a later grant tries again.
        loading = null;
      },
    );
    return loading;
  }

  return {
    enabled,
    getConsent,
    setConsent(choice) {
      if (!enabled) return;
      const previous = getConsent();
      writeAnalyticsConsent(deps.storage, choice);
      if (previous === choice) return;
      consent = choice;
      for (const listener of listeners) listener();
      if (choice === "denied") {
        if (client) withdraw(client);
      } else if (client) {
        optIn(client);
      } else {
        void ensureLoaded();
      }
    },
    start() {
      if (getConsent() === "granted") void ensureLoaded();
    },
    capture(event, ...properties) {
      if (getConsent() !== "granted") return;
      const props = properties[0];
      if (client) {
        client.capture(event, props);
        return;
      }
      void ensureLoaded().then(() => {
        if (client && getConsent() === "granted") client.capture(event, props);
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async ready() {
      await loading;
    },
  };
}
