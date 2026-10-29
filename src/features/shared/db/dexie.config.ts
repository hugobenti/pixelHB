/**
 * Purpose:
 * IndexedDB bootstrap for PixelHB using Dexie.js (artworks table + schema versioning).
 */
import Dexie, { type Table } from "dexie";

import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import type { IArtworkDeletion, IRemovedArtwork, IStoredArtwork } from "@/features/shared/artwork/artworkSync.type";

export class PixelCraftDB extends Dexie {
  artworks!: Table<IStoredArtwork, string>;
  deletions!: Table<IArtworkDeletion, string>;
  removedArtworks!: Table<IRemovedArtwork, string>;

  constructor() {
    super("PixelCraftDB");
    this.version(1).stores({
      artworks: "id, updatedAt, title",
    });
    this.version(2)
      .stores({
        artworks: "id, updatedAt, title",
      })
      .upgrade((tx) =>
        tx
          .table("artworks")
          .toCollection()
          .modify((record: Partial<IArtwork>) => {
            if (typeof record.referenceImageDataUrl !== "string") {
              record.referenceImageDataUrl = undefined;
            }
          })
      );
    this.version(3)
      .stores({
        artworks: "id, updatedAt, title",
      })
      .upgrade((tx) =>
        tx
          .table("artworks")
          .toCollection()
          .modify((record: Partial<IArtwork>) => {
            if (!Array.isArray(record.layers)) {
              record.layers = [];
            }
            if (typeof record.activeLayerId !== "string") {
              record.activeLayerId = "";
            }
          })
      );
    this.version(4)
      .stores({
        artworks: "id, updatedAt, title, ownerId",
        deletions: "id, ownerId",
      })
      .upgrade((tx) =>
        tx
          .table("artworks")
          .toCollection()
          .modify((record: Partial<IStoredArtwork>) => {
            if (record.ownerId === undefined) {
              record.ownerId = null;
              record.sync = { state: "local", syncedUpdatedAt: null };
            }
          })
      );
    // Rows the engine removed after Drive trashed them; nothing existing is rewritten.
    this.version(5).stores({
      removedArtworks: "id, ownerId, removedAt",
    });
  }
}

export const db = new PixelCraftDB();
