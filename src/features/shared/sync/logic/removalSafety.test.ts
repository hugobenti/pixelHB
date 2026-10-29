import { describe, expect, it } from "vitest";

import { isDeletionConfirmed, removalBrake } from "./removalSafety";

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

describe("removalBrake", () => {
  const brake = (removalCount: number, rootFolderTrashed = false) => removalBrake({ removalCount, rootFolderTrashed });

  it("never brakes when nothing would be removed", () => {
    expect(brake(0, true)).toBeNull();
  });

  it("does not brake on count: deleting many, half, all but one or all artworks on another device is legitimate", () => {
    for (const count of [1, 3, 5, 9, 40]) expect(brake(count)).toBeNull();
  });

  it("brakes whenever the PixelHB folder is in the trash", () => {
    expect(brake(1, true)).toBe("folderTrashed");
    expect(brake(40, true)).toBe("folderTrashed");
  });
});
