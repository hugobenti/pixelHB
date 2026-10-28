import { describe, expect, it } from "vitest";

import { conflictCopyTitle, needsConflictCopy } from "./conflictCopy";

const SUFFIX = " (conflict copy)";

describe("conflictCopyTitle", () => {
  it("appends the suffix", () => {
    expect(conflictCopyTitle("Sunset cat", SUFFIX, 100)).toBe("Sunset cat (conflict copy)");
  });

  it("trims the title before appending", () => {
    expect(conflictCopyTitle("  Sunset cat  ", SUFFIX, 100)).toBe("Sunset cat (conflict copy)");
  });

  it("does not stack a second suffix on a title that already carries it", () => {
    expect(conflictCopyTitle("Sunset cat (conflict copy)", SUFFIX, 100)).toBe(
      "Sunset cat (conflict copy)",
    );
  });

  it("shortens the title, not the suffix, to fit the limit", () => {
    const title = conflictCopyTitle("a".repeat(300), SUFFIX, 100);
    expect(Array.from(title)).toHaveLength(100);
    expect(title.endsWith(SUFFIX)).toBe(true);
  });

  it("counts a character outside the BMP once and never splits it", () => {
    const title = conflictCopyTitle("🙂".repeat(300), SUFFIX, 100);
    expect(Array.from(title)).toHaveLength(100);
    expect(title).toBe(`${"🙂".repeat(100 - Array.from(SUFFIX).length)}${SUFFIX}`);
  });

  it("keeps a title that fits as is", () => {
    const title = "b".repeat(100 - SUFFIX.length);
    expect(conflictCopyTitle(title, SUFFIX, 100)).toBe(`${title}${SUFFIX}`);
  });

  it("does not leave trailing spaces before the suffix when cutting", () => {
    const cut = conflictCopyTitle(`${"a".repeat(83)} ${"b".repeat(50)}`, SUFFIX, 100);
    expect(cut).toBe(`${"a".repeat(83)}${SUFFIX}`);
  });

  it("falls back to the suffix alone for an empty title", () => {
    expect(conflictCopyTitle("   ", SUFFIX, 100)).toBe(SUFFIX.trim());
  });
});

describe("needsConflictCopy", () => {
  it.each([
    ["dirty, Drive newer", { id: "a", updatedAt: 100, state: "dirty" as const }, 200, true],
    ["too large, Drive newer", { id: "a", updatedAt: 100, state: "tooLarge" as const }, 200, true],
    [
      "dirty, tie (same version, not a lost edit)",
      { id: "a", updatedAt: 100, state: "dirty" as const },
      100,
      false,
    ],
    ["dirty, Drive older", { id: "a", updatedAt: 200, state: "dirty" as const }, 100, false],
    [
      "synced, Drive newer (nothing local to lose)",
      { id: "a", updatedAt: 100, state: "synced" as const },
      200,
      false,
    ],
  ])("%s", (_label, local, remoteUpdatedAt, expected) => {
    expect(needsConflictCopy(local, remoteUpdatedAt)).toBe(expected);
  });
});
