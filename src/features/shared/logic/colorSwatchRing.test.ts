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
  it("shows no marker on a compact swatch", () => {
    expect(colorSwatchMarkers({ density: "compact", selected: true })).toEqual({
      primary: false,
      secondary: false,
    });
  });

  it("marks the primary, the secondary or both slots on a comfortable swatch", () => {
    expect(colorSwatchMarkers({ density: "comfortable", isPrimary: true, isSecondary: false })).toEqual({
      primary: true,
      secondary: false,
    });
    expect(colorSwatchMarkers({ density: "comfortable", isPrimary: false, isSecondary: true })).toEqual({
      primary: false,
      secondary: true,
    });
    expect(colorSwatchMarkers({ density: "comfortable", isPrimary: true, isSecondary: true })).toEqual({
      primary: true,
      secondary: true,
    });
  });
});
