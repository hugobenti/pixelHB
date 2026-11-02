import { describe, expect, it } from "vitest";

import { colorSwatchMarkers, colorSwatchRing } from "@/features/shared/logic/colorSwatchRing";

describe("colorSwatchRing", () => {
  it("marks a compact swatch as selected or idle", () => {
    expect(colorSwatchRing({ density: "compact", selected: true })).toBe("selected");
    expect(colorSwatchRing({ density: "compact", selected: false })).toBe("idle");
  });

  it("marks a color that is both primary and secondary", () => {
    expect(colorSwatchRing({ density: "comfortable", isPrimary: true, isSecondary: true })).toBe(
      "both",
    );
  });

  it("marks the primary or the secondary color", () => {
    expect(colorSwatchRing({ density: "comfortable", isPrimary: true, isSecondary: false })).toBe(
      "primary",
    );
    expect(colorSwatchRing({ density: "comfortable", isPrimary: false, isSecondary: true })).toBe(
      "secondary",
    );
  });

  it("leaves any other comfortable swatch idle", () => {
    expect(colorSwatchRing({ density: "comfortable", isPrimary: false, isSecondary: false })).toBe(
      "idle",
    );
  });
});

describe("colorSwatchMarkers", () => {
  const row = (activeSlot: "primary" | "secondary", isPrimary: boolean, isSecondary: boolean) =>
    colorSwatchMarkers({ density: "comfortable", activeSlot, isPrimary, isSecondary });

  it("shows no marker on a compact swatch", () => {
    expect(colorSwatchMarkers({ density: "compact" })).toEqual({ topLeft: false, bottomRight: false });
  });

  it("puts the top-left marker on the primary swatch while primary is active", () => {
    expect(row("primary", true, false)).toEqual({ topLeft: true, bottomRight: false });
    expect(row("primary", false, true)).toEqual({ topLeft: false, bottomRight: true });
  });

  it("puts the top-left marker on the secondary swatch while secondary is active", () => {
    expect(row("secondary", false, true)).toEqual({ topLeft: true, bottomRight: false });
    expect(row("secondary", true, false)).toEqual({ topLeft: false, bottomRight: true });
  });

  it("shows both markers on a swatch holding both slots, and none on others", () => {
    expect(row("primary", true, true)).toEqual({ topLeft: true, bottomRight: true });
    expect(row("secondary", true, true)).toEqual({ topLeft: true, bottomRight: true });
    expect(row("primary", false, false)).toEqual({ topLeft: false, bottomRight: false });
  });
});
