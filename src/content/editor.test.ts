import { describe, expect, it } from "vitest";

import { editor } from "./editor";

describe("editor.settings.imageDetail.summary", () => {
  it("uses singular nouns for a count of one", () => {
    expect(editor.settings.imageDetail.summary(1, 1)).toBe(
      "1 composited pixel across 1 visible cell (layers stacked; no double counting)."
    );
  });

  it("uses plural nouns for other counts", () => {
    expect(editor.settings.imageDetail.summary(0, 12)).toBe(
      "0 composited pixels across 12 visible cells (layers stacked; no double counting)."
    );
  });
});

describe("editor.toolbar.colors.label", () => {
  it("names the painting color, the right-click color and the shortcut", () => {
    expect(editor.toolbar.colors.label("#1A1C2C", "#F4F4F4")).toBe(
      "Colors: painting with #1A1C2C, right-click paints #F4F4F4. Press X to switch."
    );
  });
});
