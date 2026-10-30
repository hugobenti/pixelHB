import { describe, expect, it } from "vitest";

import {
  EXPORT_CREDIT_KEY,
  EXPORT_SCALE_KEY,
  parseExportScale,
  readStoredExportCredit,
  readStoredExportScale,
  writeStoredExportCredit,
  writeStoredExportScale,
} from "./exportPreferences";

describe("parseExportScale", () => {
  it("accepts allowed scales only", () => {
    expect(parseExportScale("8")).toBe(8);
    expect(parseExportScale("3")).toBeNull();
    expect(parseExportScale("abc")).toBeNull();
    expect(parseExportScale(null)).toBeNull();
  });
});

describe("stored export scale", () => {
  const throwing = {
    getItem: () => {
      throw new Error("denied");
    },
    setItem: () => {
      throw new Error("denied");
    },
  };

  it("reads null and does not throw when storage throws", () => {
    expect(readStoredExportScale(() => throwing)).toBeNull();
  });

  it("does not throw when writing to throwing storage", () => {
    expect(() => writeStoredExportScale(() => throwing, 8)).not.toThrow();
  });

  it("reads null and does not throw when reaching storage itself throws", () => {
    const denied = () => {
      throw new Error("SecurityError");
    };
    expect(readStoredExportScale(denied)).toBeNull();
    expect(() => writeStoredExportScale(denied, 4)).not.toThrow();
  });

  it("round-trips through working storage", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
    writeStoredExportScale(() => storage, 16);
    expect(values.get(EXPORT_SCALE_KEY)).toBe("16");
    expect(readStoredExportScale(() => storage)).toBe(16);
  });
});

describe("stored export credit", () => {
  const throwing = {
    getItem: () => {
      throw new Error("denied");
    },
    setItem: () => {
      throw new Error("denied");
    },
  };

  it("defaults to on when storage throws or is unreachable", () => {
    expect(readStoredExportCredit(() => throwing)).toBe(true);
    expect(
      readStoredExportCredit(() => {
        throw new Error("SecurityError");
      }),
    ).toBe(true);
  });

  it("does not throw when writing to throwing storage", () => {
    expect(() => writeStoredExportCredit(() => throwing, false)).not.toThrow();
    expect(() =>
      writeStoredExportCredit(() => {
        throw new Error("SecurityError");
      }, true),
    ).not.toThrow();
  });

  it("round-trips through working storage", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
    expect(readStoredExportCredit(() => storage)).toBe(true);
    writeStoredExportCredit(() => storage, false);
    expect(values.get(EXPORT_CREDIT_KEY)).toBe("off");
    expect(readStoredExportCredit(() => storage)).toBe(false);
    writeStoredExportCredit(() => storage, true);
    expect(readStoredExportCredit(() => storage)).toBe(true);
  });
});
