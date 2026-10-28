import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearAccountHint, readAccountHint, writeAccountHint } from "./accountHintStore";
import { SESSION_MAX_AGE_SECONDS } from "./sessionLifetime";

const NOW = 1_700_000_000_000;
const hint = { id: "g1", name: "Ada", image: null, savedAt: NOW };

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    size: () => map.size,
  };
}

describe("account hint store", () => {
  let storage: ReturnType<typeof fakeStorage>;
  beforeEach(() => {
    storage = fakeStorage();
    vi.stubGlobal("localStorage", storage);
    vi.spyOn(Date, "now").mockReturnValue(NOW + 1000);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("writes, reads and clears", () => {
    writeAccountHint(hint);
    expect(readAccountHint()).toEqual(hint);
    clearAccountHint();
    expect(readAccountHint()).toBeNull();
  });

  it("treats an expired hint as no hint and removes it", () => {
    writeAccountHint(hint);
    vi.spyOn(Date, "now").mockReturnValue(NOW + SESSION_MAX_AGE_SECONDS * 1000 + 1);
    expect(readAccountHint()).toBeNull();
    expect(storage.size()).toBe(0);
  });

  it("returns null without throwing when storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readAccountHint()).toBeNull();
    expect(() => writeAccountHint(hint)).not.toThrow();
    expect(() => clearAccountHint()).not.toThrow();
  });
});
