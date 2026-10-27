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
    expect(holdRemoteOnly([remote("a")], [remote("a"), remote("b")], [])).toHaveLength(2);
  });

  it("keeps an item the engine dropped until the local list contains it", () => {
    const shown = [remote("a")];
    expect(holdRemoteOnly(shown, [], [])).toEqual([remote("a")]);
    expect(holdRemoteOnly(shown, [], [local("a")])).toEqual([]);
  });

  it("uses the current object for an item still listed", () => {
    const fresh = remote("a", "Renamed");
    expect(holdRemoteOnly([remote("a")], [fresh], [])[0]).toBe(fresh);
  });

  it("returns the previous array when nothing changed", () => {
    const a = remote("a");
    const shown = [a];
    expect(holdRemoteOnly(shown, [a], [])).toBe(shown);
    expect(holdRemoteOnly(shown, [], [])).toBe(shown);
  });
});
