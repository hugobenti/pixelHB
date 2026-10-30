import { describe, expect, it } from "vitest";

import { parseExportScale } from "./exportPreferences";

describe("parseExportScale", () => {
  it("accepts allowed scales only", () => {
    expect(parseExportScale("8")).toBe(8);
    expect(parseExportScale("3")).toBeNull();
    expect(parseExportScale("abc")).toBeNull();
    expect(parseExportScale(null)).toBeNull();
  });
});
