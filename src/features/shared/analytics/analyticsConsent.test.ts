import { describe, expect, test } from "vitest";

import {
  ANALYTICS_CONSENT_KEY,
  parseAnalyticsConsent,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "./analyticsConsent";

function memoryStorage(initial: Record<string, string> = {}, throws = false) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    get: (key: string) => {
      if (throws) throw new Error("blocked");
      return values.get(key) ?? null;
    },
    set: (key: string, value: string) => {
      if (throws) throw new Error("blocked");
      values.set(key, value);
    },
  };
}

describe("parseAnalyticsConsent", () => {
  test("keeps an explicit choice", () => {
    expect(parseAnalyticsConsent("granted")).toBe("granted");
    expect(parseAnalyticsConsent("denied")).toBe("denied");
  });

  test("anything else means no choice yet", () => {
    expect(parseAnalyticsConsent(null)).toBeNull();
    expect(parseAnalyticsConsent("")).toBeNull();
    expect(parseAnalyticsConsent("GRANTED")).toBeNull();
    expect(parseAnalyticsConsent("true")).toBeNull();
  });
});

describe("consent storage", () => {
  test("uses a pixelhb-prefixed key", () => {
    expect(ANALYTICS_CONSENT_KEY.startsWith("pixelhb.")).toBe(true);
  });

  test("round-trips the choice", () => {
    const storage = memoryStorage();
    expect(readAnalyticsConsent(storage)).toBeNull();
    writeAnalyticsConsent(storage, "granted");
    expect(storage.values.get(ANALYTICS_CONSENT_KEY)).toBe("granted");
    expect(readAnalyticsConsent(storage)).toBe("granted");
    writeAnalyticsConsent(storage, "denied");
    expect(readAnalyticsConsent(storage)).toBe("denied");
  });

  test("ignores a garbled stored value", () => {
    expect(readAnalyticsConsent(memoryStorage({ [ANALYTICS_CONSENT_KEY]: "maybe" }))).toBeNull();
  });

  test("blocked storage reads as no choice and writing does not throw", () => {
    const storage = memoryStorage({}, true);
    expect(readAnalyticsConsent(storage)).toBeNull();
    expect(() => writeAnalyticsConsent(storage, "granted")).not.toThrow();
  });
});
