import { describe, expect, it } from "vitest";

import type { IArtworkSummary } from "@/features/shared/artwork/artwork.type";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";
import { holdRemoteOnly } from "./holdRemoteOnly";

const remote = (id: string, title = id): IGalleryListItem => ({
  id,
  title,
  width: 8,
  height: 8,
  createdAt: 0,
  updatedAt: 1,
  previewUrl: `/p/${id}`,
});
const local = (id: string): IArtworkSummary => ({
  id,
  title: id,
  width: 8,
  height: 8,
  createdAt: 0,
  updatedAt: 1,
  thumbnail: "",
  syncState: "synced",
});

describe("holdRemoteOnly", () => {
  it("returns the current Drive-only items when nothing was dropped", () => {
    expect(holdRemoteOnly([remote("a")], [remote("a"), remote("b")], [], "syncing")).toHaveLength(
      2,
    );
  });

  it("keeps an item the engine dropped while syncing, until the local list contains it", () => {
    const shown = [remote("a")];
    expect(holdRemoteOnly(shown, [], [], "syncing")).toEqual([remote("a")]);
    expect(holdRemoteOnly(shown, [], [local("a")], "syncing")).toEqual([]);
  });

  it("drops a vanished item with no local row once the sync pass is over", () => {
    const shown = [remote("a")];
    expect(holdRemoteOnly(shown, [], [], "idle")).toEqual([]);
    expect(holdRemoteOnly(shown, [], [], "offline")).toEqual([]);
  });

  it("uses the current object for an item still listed", () => {
    const fresh = remote("a", "Renamed");
    expect(holdRemoteOnly([remote("a")], [fresh], [], "idle")[0]).toBe(fresh);
  });

  it("returns the previous array when nothing changed", () => {
    const a = remote("a");
    const shown = [a];
    expect(holdRemoteOnly(shown, [a], [], "idle")).toBe(shown);
    expect(holdRemoteOnly(shown, [], [], "syncing")).toBe(shown);
  });
});
