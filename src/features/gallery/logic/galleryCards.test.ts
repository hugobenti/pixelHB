import { describe, expect, it } from "vitest";

import type { IArtworkSummary } from "@/features/shared/artwork/artwork.type";
import type { TArtworkSyncState } from "@/features/shared/artwork/artworkSync.type";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";
import { galleryCards } from "./galleryCards";

const local = (
  id: string,
  updatedAt: number,
  syncState: TArtworkSyncState = "synced",
): IArtworkSummary => ({
  id,
  title: id,
  width: 16,
  height: 16,
  createdAt: 0,
  updatedAt,
  thumbnail: "data:image/png;base64,AAAA",
  syncState,
});
const remote = (id: string, updatedAt: number): IGalleryListItem => ({
  id,
  title: id,
  width: 32,
  height: 32,
  createdAt: 0,
  updatedAt,
  previewUrl: `/api/gallery/${id}/preview?v=${updatedAt}`,
});

describe("galleryCards", () => {
  it("keeps a local artwork openable with its data-URL thumbnail", () => {
    expect(galleryCards([local("a", 5)], [], true)).toEqual([
      {
        id: "a",
        title: "a",
        width: 16,
        height: 16,
        updatedAt: 5,
        thumbnail: { src: "data:image/png;base64,AAAA", unoptimized: true },
        openable: true,
        marker: null,
      },
    ]);
  });

  it("shows a Drive-only artwork as a downloading card whose preview bypasses the image optimizer", () => {
    expect(galleryCards([], [remote("r", 9)], true)).toEqual([
      {
        id: "r",
        title: "r",
        width: 32,
        height: 32,
        updatedAt: 9,
        thumbnail: { src: "/api/gallery/r/preview?v=9", unoptimized: true },
        openable: false,
        marker: "downloading",
      },
    ]);
  });

  it("says a Drive-only artwork is in Drive, not downloading, while no sync pass runs", () => {
    expect(galleryCards([], [remote("r", 9)], false)[0]).toMatchObject({
      openable: false,
      marker: "inDrive",
    });
  });

  it("drops a Drive-only entry once the artwork exists locally", () => {
    const cards = galleryCards([local("a", 5)], [remote("a", 9)], true);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ id: "a", openable: true, updatedAt: 5 });
  });

  it("orders local and Drive-only cards together, most recently edited first", () => {
    const ids = galleryCards(
      [local("a", 5), local("c", 1)],
      [remote("b", 3), remote("d", 7)],
      true,
    ).map((c) => c.id);
    expect(ids).toEqual(["d", "a", "b", "c"]);
  });

  it("marks unsynced and too-large artworks, never local or synced ones", () => {
    const markers = galleryCards(
      [
        local("d", 4, "dirty"),
        local("t", 3, "tooLarge"),
        local("l", 2, "local"),
        local("s", 1, "synced"),
      ],
      [],
      true,
    ).map((c) => c.marker);
    expect(markers).toEqual(["notSynced", "tooLarge", null, null]);
  });
});
