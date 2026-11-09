import { describe, expect, it } from "vitest";
import { BRAND_FIXED_COLORS } from "./brandArt";
import { HORIZONTAL_LOGO, PENCIL_LOGO } from "./logoDrawing";

describe("logo drawings", () => {
  it("sizes each viewBox to its lockup", () => {
    expect(HORIZONTAL_LOGO.viewBox).toBe("0 0 74 7");
    expect(PENCIL_LOGO.viewBox).toBe("0 0 33 7");
  });

  it("fills the pencil with fixed brand colors or the foreground token only", () => {
    const allowed = new Set<string>([...Object.values(BRAND_FIXED_COLORS), "var(--color-fg)"]);
    for (const rect of PENCIL_LOGO.rects) expect(allowed.has(rect.fill)).toBe(true);
  });
});
