import { describe, expect, it } from "vitest";

import { help } from "@/content/help";

import { formatKeyCombo } from "./keyCombo";

const names = help.keyNames;

describe("formatKeyCombo", () => {
  it("formats a modifier combo per platform", () => {
    expect(formatKeyCombo({ key: "z", mod: true }, "apple", names)).toBe("⌘Z");
    expect(formatKeyCombo({ key: "z", mod: true }, "other", names)).toBe("Ctrl+Z");
  });

  it("formats modifier plus shift per platform", () => {
    expect(formatKeyCombo({ key: "z", mod: true, shift: true }, "apple", names)).toBe("⇧⌘Z");
    expect(formatKeyCombo({ key: "z", mod: true, shift: true }, "other", names)).toBe("Ctrl+Shift+Z");
  });

  it("upper-cases a bare letter", () => {
    expect(formatKeyCombo({ key: "g" }, "apple", names)).toBe("G");
    expect(formatKeyCombo({ key: "g" }, "other", names)).toBe("G");
  });

  it("names Space and the arrow keys", () => {
    expect(formatKeyCombo({ key: "Space" }, "other", names)).toBe("Space");
    expect(formatKeyCombo({ key: "Arrows" }, "apple", names)).toBe("Arrow keys");
    expect(formatKeyCombo({ key: "Arrows" }, "other", names)).toBe("Arrow keys");
  });

  it("shows Alt as the Option glyph on Apple and by name elsewhere", () => {
    expect(formatKeyCombo({ key: "Alt" }, "apple", names)).toBe("⌥");
    expect(formatKeyCombo({ key: "Alt" }, "other", names)).toBe("Alt");
  });
});
