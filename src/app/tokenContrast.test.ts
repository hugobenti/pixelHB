import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import {
  contrastRatio,
  readSelectorColors,
  readThemeColors,
} from "@/features/shared/utils/colorContrast";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const light = readThemeColors(css);
const darkOverrides = readSelectorColors(css, '[data-theme="dark"]');
const themes: Array<[string, Record<string, string>]> = [
  ["light", light],
  ["dark", { ...light, ...darkOverrides }],
];

const textPairs = [
  ["fg", "bg"],
  ["fg", "surface"],
  ["fg", "surface-subtle"],
  ["fg", "surface-muted"],
  ["fg-soft", "surface"],
  ["fg-soft", "surface-subtle"],
  ["fg-soft", "surface-muted"],
  ["fg-secondary", "bg"],
  ["fg-secondary", "surface"],
  ["fg-secondary", "surface-subtle"],
  ["muted", "bg"],
  ["muted", "surface"],
  ["muted", "surface-subtle"],
  ["muted", "surface-muted"],
  ["subtle", "surface"],
  ["subtle", "surface-subtle"],
  ["on-accent", "accent"],
  ["on-accent", "accent-hover"],
  ["on-danger", "danger"],
  ["on-danger", "danger-hover"],
  ["danger-fg", "bg"],
  ["danger-fg", "danger-surface"],
  ["danger-fg-strong", "danger-surface"],
  ["success-fg", "success-surface"],
  ["google-btn-text", "google-btn-fill"],
];

const uiPairs = [
  ["focus", "bg"],
  ["focus", "surface"],
  ["focus", "surface-muted"],
  ["accent", "bg"],
  ["accent", "surface"],
  ["danger", "bg"],
  ["danger", "surface"],
  ["pick-primary", "surface"],
  ["pick-secondary", "surface"],
  ["loupe-edge-light", "loupe-edge-dark"],
  ["brand-hb", "bg"],
  ["brand-hb", "surface"],
  ["surface", "surface-inverse"],
  ["control-border", "bg"],
  ["control-border", "surface"],
  ["control-border", "surface-subtle"],
  ["google-btn-stroke", "google-btn-fill"],
  ["google-btn-stroke", "bg"],
  ["google-btn-stroke", "surface"],
];

const SWEETIE_DARKEST = "#1a1c2c";

describe.each(themes)("%s theme tokens meet WCAG 2.2 AA", (_name, tokens) => {
  function ratio(foreground: string, background: string): number {
    const fg = tokens[foreground];
    const bg = tokens[background];
    if (!fg || !bg) {
      throw new Error(`missing color token: ${!fg ? foreground : background}`);
    }
    return contrastRatio(fg, bg);
  }

  test.each(textPairs)("text %s on %s ≥ 4.5:1", (foreground, background) => {
    expect(ratio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  test.each(uiPairs)("UI %s on %s ≥ 3:1", (foreground, background) => {
    expect(ratio(foreground, background)).toBeGreaterThanOrEqual(3);
  });

  // Light guides sit directly on the checkerboard; dark guides sit on their halo.
  const guideBackdrops = _name === "light" ? ["checker-light", "checker-dark"] : ["guide-halo"];
  test.each(
    ["guide-horizontal", "guide-vertical"].flatMap((g) => guideBackdrops.map((b) => [g, b]))
  )("UI %s on %s ≥ 3:1", (foreground, background) => {
    expect(ratio(foreground, background)).toBeGreaterThanOrEqual(3);
  });

  test.each(["checker-light", "checker-dark"])(
    "the darkest palette color (#1A1C2C) on %s ≥ 3:1",
    (checker) => {
      const tone = tokens[checker];
      if (!tone) {
        throw new Error(`missing color token: ${checker}`);
      }
      expect(contrastRatio(SWEETIE_DARKEST, tone)).toBeGreaterThanOrEqual(3);
    }
  );

  test("the two checker tones stay distinguishable (≥ 1.1:1)", () => {
    expect(ratio("checker-light", "checker-dark")).toBeGreaterThanOrEqual(1.1);
  });
});

test("the dark theme overrides every color token, so no light value leaks into it", () => {
  expect(Object.keys(darkOverrides).sort()).toEqual(Object.keys(light).sort());
});
