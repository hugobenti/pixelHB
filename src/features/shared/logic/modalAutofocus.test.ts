import { describe, expect, it } from "vitest";

import { isTextEntryField, shouldAutofocusTarget } from "@/features/shared/logic/modalAutofocus";

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

describe("isTextEntryField", () => {
  it("treats text-like inputs, an untyped input, textareas and contenteditable as text entry", () => {
    for (const inputType of ["text", "search", "email", "url", "tel", "password", "number", ""]) {
      expect(isTextEntryField({ tagName: "INPUT", inputType })).toBe(true);
    }
    expect(isTextEntryField({ tagName: "INPUT" })).toBe(true);
    expect(isTextEntryField({ tagName: "TEXTAREA" })).toBe(true);
    expect(isTextEntryField({ tagName: "DIV", isContentEditable: true })).toBe(true);
  });

  it("does not treat a checkbox, radio, range, color or button as text entry", () => {
    for (const inputType of ["checkbox", "radio", "range", "color", "button", "submit"]) {
      expect(isTextEntryField({ tagName: "INPUT", inputType })).toBe(false);
    }
    expect(isTextEntryField({ tagName: "BUTTON" })).toBe(false);
  });
});
