import { describe, expect, it } from "vitest";

import { isDeletionConfirmed, shouldBrakeRemovals } from "./removalSafety";

describe("isDeletionConfirmed", () => {
  it("confirms only a trashed copy at least as new as the version we last synced", () => {
    expect(isDeletionConfirmed({ state: "trashed", updatedAt: 100 }, 100)).toBe(true);
    expect(isDeletionConfirmed({ state: "trashed", updatedAt: 150 }, 100)).toBe(true);
  });

  it("does not confirm a trashed copy older than our synced version (an old duplicate, not our deletion)", () => {
    expect(isDeletionConfirmed({ state: "trashed", updatedAt: 99 }, 100)).toBe(false);
  });

  it.each([
    ["present", { state: "present", updatedAt: 200 } as const],
    ["absent", { state: "absent" } as const],
    ["trashed without a readable stamp", { state: "trashed" } as const],
  ])("does not confirm %s", (_label, status) => {
    expect(isDeletionConfirmed(status, 100)).toBe(false);
  });

  it("does not confirm when the row was never synced", () => {
    expect(isDeletionConfirmed({ state: "trashed", updatedAt: 100 }, null)).toBe(false);
  });
});

describe("shouldBrakeRemovals", () => {
  const brake = (removalCount: number, syncedCount: number, remoteListEmpty = false) =>
    shouldBrakeRemovals({ removalCount, syncedCount, remoteListEmpty });

  it("never brakes when nothing would be removed", () => {
    expect(brake(0, 10)).toBe(false);
    expect(brake(0, 10, true)).toBe(false);
  });

  it("lets a few removals through while most of the gallery stays", () => {
    expect(brake(1, 10)).toBe(false);
    expect(brake(2, 10)).toBe(false);
    expect(brake(1, 2)).toBe(false);
  });

  it("brakes at three removals and at half of the synced rows, whichever is larger", () => {
    expect(brake(3, 10)).toBe(false);
    expect(brake(3, 6)).toBe(true);
    expect(brake(5, 10)).toBe(true);
    expect(brake(4, 10)).toBe(false);
    expect(brake(3, 3)).toBe(true);
  });

  it("brakes whenever the remote list is empty and something would be removed", () => {
    expect(brake(1, 1, true)).toBe(true);
    expect(brake(1, 20, true)).toBe(true);
  });
});
