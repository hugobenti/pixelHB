import { describe, expect, it } from "vitest";

import type { IArtworkSummary } from "@/features/shared/artwork/artwork.type";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";
import { holdRemoteOnly } from "./holdRemoteOnly";

const remote = (id: string): IGalleryListItem => ({
  id,
  title: id,
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
    const shown = [remote("a")];
    expect(holdRemoteOnly(shown, [remote("a"), remote("b")], [])).toEqual([
      remote("a"),
      remote("b"),
    ]);
  });

  it("keeps an item the engine dropped until the local list contains it", () => {
    const shown = [remote("a")];
    expect(holdRemoteOnly(shown, [], [])).toEqual([remote("a")]);
    expect(holdRemoteOnly(shown, [], [local("a")])).toEqual([]);
  });

  it("returns the previous array when the held ids did not change", () => {
    const shown = [remote("a")];
    expect(holdRemoteOnly(shown, [remote("a")], [])).toBe(shown);
    expect(holdRemoteOnly(shown, [], [])).toBe(shown);
  });
});
