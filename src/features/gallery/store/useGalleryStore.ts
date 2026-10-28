/**
 * Purpose:
 * Zustand store for gallery listing, loading state, and artwork mutations wired to Dexie.
 */
import { create } from "zustand";

import { gallery } from "@/content/gallery";
import * as artworkService from "@/features/shared/artwork/artworkService";
import type { IGalleryState } from "./useGalleryStore.type";

export const useGalleryStore = create<IGalleryState>((set, get) => ({
  artworks: [],
  loading: false,
  loaded: false,
  error: null,

  loadArtworks: async () => {
    set({ loading: true, error: null });
    try {
      const artworks = await artworkService.listArtworkSummaries();
      set({ artworks, loading: false, loaded: true });
    } catch {
      const message = gallery.errors.load;
      set({ error: message, loading: false, loaded: true });
    }
  },

  createArtwork: async (input) => {
    try {
      const artwork = await artworkService.createArtwork(input);
      await get().loadArtworks();
      return { artwork, error: null };
    } catch (e) {
      return { artwork: null, error: e instanceof Error ? e.message : gallery.errors.create };
    }
  },

  importArtwork: async (input) => {
    set({ error: null });
    try {
      const created = await artworkService.createArtworkFromImport(input);
      await get().loadArtworks();
      return created;
    } catch {
      const message = gallery.errors.import;
      set({ error: message });
      return null;
    }
  },

  renameArtwork: async (id, title) => {
    set({ error: null });
    try {
      const renamed = await artworkService.renameArtwork(id, title);
      await get().loadArtworks();
      // Nothing was written (the row is gone or belongs to another account): say so.
      if (!renamed) set({ error: gallery.errors.rename });
    } catch {
      const message = gallery.errors.rename;
      set({ error: message });
    }
  },

  cloneArtwork: async (id) => {
    set({ error: null });
    try {
      const clone = await artworkService.cloneArtwork(id);
      await get().loadArtworks();
      return clone;
    } catch {
      const message = gallery.errors.clone;
      set({ error: message });
      return undefined;
    }
  },

  deleteArtwork: async (id) => {
    set({ error: null });
    try {
      const deleted = await artworkService.deleteArtwork(id);
      await get().loadArtworks();
      if (!deleted) set({ error: gallery.errors.delete });
    } catch {
      const message = gallery.errors.delete;
      set({ error: message });
    }
  },

  updateThumbnail: async (id, thumbnail) => {
    set((state) => ({
      artworks: state.artworks.map((artwork) =>
        artwork.id === id ? { ...artwork, thumbnail } : artwork,
      ),
    }));
    try {
      await artworkService.saveThumbnail(id, thumbnail);
    } catch {
      // The fresh thumbnail still shows for this visit; it is regenerated on the next load.
    }
  },
}));
