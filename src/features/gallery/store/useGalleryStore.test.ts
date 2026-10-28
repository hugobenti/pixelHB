import "fake-indexeddb/auto";
import { beforeEach, expect, test } from "vitest";

import { gallery } from "@/content/gallery";
import * as artworkService from "@/features/shared/artwork/artworkService";
import { db } from "@/features/shared/db/dexie.config";
import { useGalleryStore } from "./useGalleryStore";

const input = { title: "Cat", width: 2, height: 2, backgroundColor: "#1A1C2C" };

beforeEach(async () => {
  artworkService.setActiveOwner(null);
  await db.artworks.clear();
  await db.deletions.clear();
  useGalleryStore.setState({ error: null });
});

test("rename and delete that wrote nothing (row of another owner) show an error instead of nothing", async () => {
  const art = await artworkService.createArtwork(input);
  artworkService.setActiveOwner("u1");
  await useGalleryStore.getState().renameArtwork(art.id, "Dog");
  expect(useGalleryStore.getState().error).toBe(gallery.errors.rename);
  await useGalleryStore.getState().deleteArtwork(art.id);
  expect(useGalleryStore.getState().error).toBe(gallery.errors.delete);
  expect(await db.artworks.get(art.id)).toMatchObject({ title: "Cat", ownerId: null });
});

test("rename and delete that wrote leave no error", async () => {
  const art = await artworkService.createArtwork(input);
  await useGalleryStore.getState().renameArtwork(art.id, "Dog");
  expect(useGalleryStore.getState().error).toBeNull();
  await useGalleryStore.getState().deleteArtwork(art.id);
  expect(useGalleryStore.getState().error).toBeNull();
  expect(await db.artworks.count()).toBe(0);
});
