import { describe, expect, it } from "vitest";

import { nextDriveFull } from "./driveFullState";

describe("nextDriveFull", () => {
  it.each([
    ["a refused upload sets it", false, "driveFull", 1, true],
    ["a refused upload keeps it", true, "driveFull", 0, true],
    ["a successful upload clears it", true, "uploaded", 3, false],
    ["a failure with another cause clears it", true, "otherFailure", 3, false],
    ["a pass without uploads keeps it while work is pending", true, "noUpload", 2, true],
    ["a pass without uploads clears it when nothing is pending", true, "noUpload", 0, false],
    ["a pass without uploads does not set it", false, "noUpload", 2, false],
  ] as const)("%s", (_label, previous, event, pending, expected) => {
    expect(nextDriveFull(previous, event, pending)).toBe(expected);
  });
});
