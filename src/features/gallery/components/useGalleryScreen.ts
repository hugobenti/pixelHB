/**
 * Purpose:
 * GalleryScreen behavior: loads the gallery, owns the create dialog, and opens the editor after a
 * create or import.
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { useGalleryImport } from "@/features/gallery/hooks/useGalleryImport";
import { useHeldRemoteOnly } from "@/features/gallery/hooks/useHeldRemoteOnly";
import { useStaleThumbnailRefresh } from "@/features/gallery/hooks/useStaleThumbnailRefresh";
import { editorPath } from "@/features/gallery/logic/artworkLinks";
import { galleryCards } from "@/features/gallery/logic/galleryCards";
import { useGalleryStore } from "@/features/gallery/store/useGalleryStore";
import { gallery } from "@/content/gallery";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";
import { useAccount } from "@/features/shared/auth/useAccount";
import { syncStatusText } from "@/features/shared/sync/logic/syncStatusMessage";
import { getSyncEngine, isDriveSyncSupported } from "@/features/shared/sync/syncEngine";
import { useSyncMessage } from "@/features/shared/sync/useSyncMessage";
import { useSyncStore } from "@/features/shared/sync/useSyncStore";
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

  const account = useAccount();
  const remoteOnly = useSyncStore((state) => state.remoteOnly);
  const phase = useSyncStore((state) => state.phase);
  const firstListPending = useSyncStore((state) => state.lastSyncedAt === null);
  const message = useSyncMessage();
  const { items: driveOnly, release } = useHeldRemoteOnly(remoteOnly, artworks);
  const cards = useMemo(
    () => galleryCards(artworks, driveOnly, phase === "syncing"),
    [artworks, driveOnly, phase],
  );
  /** Signed in with nothing local while the first Drive list is still coming: not empty yet. */
  const awaitingDrive =
    account.status === "signedIn" &&
    firstListPending &&
    cards.length === 0 &&
    (phase === "syncing" || (phase === "disabled" && isDriveSyncSupported()));

  const { showToast } = useToast();
  /** Fixed per mount: card times read as of when the gallery opened. */
  const [now] = useState(() => Date.now());
  const [modalOpen, setModalOpen] = useState(false);
  const openCreate = () => setModalOpen(true);

  useEffect(() => {
    void loadArtworks();
    const engine = getSyncEngine();
    void engine.syncNow();
    return engine.onLocalRowsChanged(
      () => void loadArtworks().then(() => release(useSyncStore.getState().remoteOnly)),
    );
    // `release` only sets state; its identity changes every render and must not rerun the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    artworks: cards,
    /** `text` is null while the account loads: the gallery then shows only the "Learn more" link. */
    storageNote: {
      text: message ? syncStatusText(message) : null,
      tone: message?.tone ?? "neutral",
    },
    now,
    loaded,
    error,
    /** The empty state only shows after a successful load; a failed first load shows just the error. */
    showEmpty: loaded && !error && cards.length === 0 && !awaitingDrive,
    count: cards.length,
    countLabel: gallery.screen.countLabel(cards.length),
    showSkeleton: !loaded || (loading && cards.length === 0) || awaitingDrive,
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
