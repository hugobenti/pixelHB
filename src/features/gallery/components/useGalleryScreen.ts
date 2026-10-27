/**
 * Purpose:
 * GalleryScreen behavior: loads the gallery, owns the create dialog, and opens the editor after a
 * create or import.
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";

import { useGalleryImport } from "@/features/gallery/hooks/useGalleryImport";
import { useStaleThumbnailRefresh } from "@/features/gallery/hooks/useStaleThumbnailRefresh";
import { editorPath } from "@/features/gallery/logic/artworkLinks";
import { useGalleryStore } from "@/features/gallery/store/useGalleryStore";
import { gallery } from "@/content/gallery";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";
import { getSyncEngine } from "@/features/shared/sync/syncEngine";
import type { ICreateArtworkInput } from "@/features/shared/artwork/artworkService.type";

export function useGalleryScreen() {
  const router = useRouter();
  const {
    artworks,
    loading,
    loaded,
    error,
    loadArtworks,
    createArtwork,
    importArtwork,
    renameArtwork,
    cloneArtwork,
    deleteArtwork,
    updateThumbnail,
  } = useGalleryStore();

  const { showToast } = useToast();
  /** Fixed per mount: card times read as of when the gallery opened. */
  const [now] = useState(() => Date.now());
  const [modalOpen, setModalOpen] = useState(false);
  const openCreate = () => setModalOpen(true);

  useEffect(() => {
    void loadArtworks();
    const engine = getSyncEngine();
    void engine.syncNow();
    return engine.onLocalRowsChanged(() => void loadArtworks());
  }, [loadArtworks]);

  useStaleThumbnailRefresh(artworks, updateThumbnail);

  const { importInputRef, openImportPicker, onImportFile } = useGalleryImport({
    importArtwork,
    onImported: (created) => {
      router.push(editorPath(created.id));
    },
  });

  const onImportChange = (event: ChangeEvent<HTMLInputElement>) => {
    void onImportFile(event.target.files?.[0] ?? null);
    event.currentTarget.value = "";
  };

  /** Resolves to an error message for the dialog, or null once the editor opens. */
  const createAndOpen = async (input: ICreateArtworkInput): Promise<string | null> => {
    const { artwork, error: createError } = await createArtwork(input);
    if (!artwork) {
      return createError;
    }
    setModalOpen(false);
    router.push(editorPath(artwork.id));
    return null;
  };

  return {
    artworks,
    now,
    loaded,
    error,
    /** The empty state only shows after a successful load; a failed first load shows just the error. */
    showEmpty: loaded && !error && artworks.length === 0,
    count: artworks.length,
    countLabel: gallery.screen.countLabel(artworks.length),
    showSkeleton: !loaded || (loading && artworks.length === 0),
    renameArtwork,
    /** The grid only awaits the clone; the store reloads the list itself. */
    cloneArtwork: async (id: string) => {
      const clone = await cloneArtwork(id);
      if (clone) showToast({ message: gallery.toasts.duplicated, tone: "success" });
    },
    deleteArtwork,
    modalOpen,
    setModalOpen,
    primaryAction: {
      kind: "button" as const,
      label: gallery.screen.newArtwork,
      compactLabel: gallery.screen.newCompact,
      onClick: openCreate,
    },
    openCreate,
    createArtwork: createAndOpen,
    importInputRef,
    openImportPicker,
    onImportChange,
  };
}
