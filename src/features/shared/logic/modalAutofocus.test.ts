import { describe, expect, it } from "vitest";

import { shouldAutofocusTarget } from "@/features/shared/logic/modalAutofocus";

describe("shouldAutofocusTarget", () => {
  it("skips a text entry on a coarse pointer, so the keyboard stays down", () => {
    expect(shouldAutofocusTarget({ coarsePointer: true, isTextEntry: true })).toBe(false);
  });

  it("focuses a text entry on a fine pointer", () => {
    expect(shouldAutofocusTarget({ coarsePointer: false, isTextEntry: true })).toBe(true);
  });

  it("focuses a non-text target on a coarse pointer", () => {
    expect(shouldAutofocusTarget({ coarsePointer: true, isTextEntry: false })).toBe(true);
  });

  it("focuses a non-text target on a fine pointer", () => {
    expect(shouldAutofocusTarget({ coarsePointer: false, isTextEntry: false })).toBe(true);
  });
});
