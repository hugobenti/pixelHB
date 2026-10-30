import { describe, expect, it } from "vitest";

import { exportFileName } from "./artworkFileName";
import {
  allowedExportScales,
  defaultExportScale,
  exportSize,
  resolveExportScale,
} from "./exportScale";

const none = () => 0;
const credit = (width: number) => Math.max(32, Math.round(width * 0.08));

describe("exportScale", () => {
  it("allows ×1 and ×4 on 1000×1000 without a strip", () => {
    expect(allowedExportScales({ width: 1000, height: 1000 }, none)).toEqual([1, 4]);
  });

  it("allows only ×1 on 1000×1000 with the credit strip", () => {
    expect(allowedExportScales({ width: 1000, height: 1000 }, credit)).toEqual([1]);
  });

  it("sizes the export with the strip below the art", () => {
    expect(exportSize({ width: 10, height: 20 }, 4, () => 5)).toEqual({
      width: 40,
      height: 85,
      artHeight: 80,
    });
  });

  it("defaults to the smallest scale reaching 1024 px", () => {
    expect(defaultExportScale({ width: 32, height: 32 }, none)).toBe(32);
    expect(defaultExportScale({ width: 64, height: 16 }, none)).toBe(16);
    expect(defaultExportScale({ width: 1000, height: 1000 }, none)).toBe(4);
  });

  it("falls back to the default for a stored scale that is too big or missing", () => {
    expect(resolveExportScale(32, { width: 500, height: 500 }, none)).toBe(4);
    expect(resolveExportScale(null, { width: 500, height: 500 }, none)).toBe(4);
  });

  it("keeps an allowed stored scale", () => {
    expect(resolveExportScale(8, { width: 500, height: 500 }, none)).toBe(8);
  });
});

describe("exportFileName", () => {
  it("names ×1 without a suffix and larger scales with @nx", () => {
    expect(exportFileName("My Art", 1)).toBe("my-art.png");
    expect(exportFileName("My Art", 8)).toBe("my-art@8x.png");
    expect(exportFileName("  ", 4)).toBe("artwork@4x.png");
  });
});
