import { describe, expect, it } from "vitest";

import { shouldResyncAfterReauth } from "./reauthRecovery";

describe("shouldResyncAfterReauth", () => {
  it.each([
    ["needsReauth cleared", true, false, true],
    ["still needs reauth", true, true, false],
    ["never needed it", false, false, false],
    ["needs it now (the engine reports that itself)", false, true, false],
    ["first render, no reauth", undefined, false, false],
    ["first render, reauth needed", undefined, true, false],
  ])("%s", (_label, previous, current, expected) => {
    expect(shouldResyncAfterReauth(previous, current)).toBe(expected);
  });
});
