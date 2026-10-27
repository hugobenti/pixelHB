import { describe, expect, it } from "vitest";

import type { IArtworkDeletion, IStoredArtwork, TArtworkSyncState } from "@/features/shared/artwork/artworkSync.type";
import { decideSignOut, summarizeUnsynced } from "./signOutDecision";

const row = (id: string, state: TArtworkSyncState, updatedAt: number): IStoredArtwork => ({
  id, title: id, width: 8, height: 8, createdAt: 0, updatedAt, thumbnail: "", palette: ["#000000"],
  layers: [], activeLayerId: "", ownerId: "u1", sync: { state, syncedUpdatedAt: null },
});
const tombstone = (id: string): IArtworkDeletion => ({ id, ownerId: "u1", deletedAt: 1 });

describe("summarizeUnsynced", () => {
  it("keeps dirty and too-large artworks, newest first, and skips synced and local ones", () => {
    const work = summarizeUnsynced(
      [row("s", "synced", 9), row("d", "dirty", 2), row("t", "tooLarge", 5), row("l", "local", 7)], [],
    );
    expect(work.artworks.map((a) => a.id)).toEqual(["t", "d"]);
    expect(work.deletionCount).toBe(0);
  });

  it("counts pending deletions", () => {
    expect(summarizeUnsynced([], [tombstone("x"), tombstone("y")]).deletionCount).toBe(2);
  });
});

describe("decideSignOut", () => {
  it("signs out at once when everything reached Drive", () => {
    expect(decideSignOut({ artworks: [], deletionCount: 0 })).toBe("signOutNow");
  });

  it("asks when an artwork is still unsynced", () => {
    expect(decideSignOut({ artworks: [row("d", "dirty", 1)], deletionCount: 0 })).toBe("askUser");
  });

  it("asks when only a deletion is still pending", () => {
    expect(decideSignOut({ artworks: [], deletionCount: 1 })).toBe("askUser");
  });

  it("asks when the local state couldn't be read", () => {
    expect(decideSignOut(null)).toBe("askUser");
  });
});
