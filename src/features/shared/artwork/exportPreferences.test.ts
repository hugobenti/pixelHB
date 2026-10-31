import { describe, expect, it } from "vitest";

import {
  EXPORT_CREDIT_KEY,
  EXPORT_SCALE_KEY,
  parseExportCredit,
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

  it("parses only an explicit on as true", () => {
    expect(parseExportCredit(null)).toBe(false);
    expect(parseExportCredit("garbage")).toBe(false);
    expect(parseExportCredit("on")).toBe(true);
  });

  it("defaults to off when storage throws or is unreachable", () => {
    expect(readStoredExportCredit(() => throwing)).toBe(false);
    expect(
      readStoredExportCredit(() => {
        throw new Error("SecurityError");
      }),
    ).toBe(false);
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
    expect(readStoredExportCredit(() => storage)).toBe(false);
    writeStoredExportCredit(() => storage, true);
    expect(values.get(EXPORT_CREDIT_KEY)).toBe("on");
    expect(readStoredExportCredit(() => storage)).toBe(true);
    writeStoredExportCredit(() => storage, false);
    expect(readStoredExportCredit(() => storage)).toBe(false);
  });
});
