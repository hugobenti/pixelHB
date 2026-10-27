/**
 * Purpose:
 * Client shell for the gallery route: loads IndexedDB entries and hosts creation modal.
 *
 * Notes:
 * After creating or importing an artwork, the app navigates to the editor for that id.
 */
"use client";

import Link from "next/link";

import { gallery } from "@/content/gallery";
import { Button } from "@/features/shared/components/Button";
import { cx } from "@/features/shared/utils/cx";
import { SiteShell } from "@/features/shared/site/SiteShell";
import { siteType } from "@/features/shared/site/siteType.style";

import { CreateArtworkModal } from "@/features/gallery/components/CreateArtworkModal";
import { GalleryGrid } from "@/features/gallery/components/GalleryGrid";
import { GallerySkeleton } from "@/features/gallery/components/GallerySkeleton";
import { galleryScreen } from "./GalleryScreen.style";
import { useGalleryScreen } from "./useGalleryScreen";

export function GalleryScreen() {
  const {
    artworks,
    storageNote,
    now,
    loaded,
    showSkeleton,
    showEmpty,
    error,
    count,
    countLabel,
    renameArtwork,
    cloneArtwork,
    deleteArtwork,
    modalOpen,
    setModalOpen,
    primaryAction,
    openCreate,
    createArtwork,
    importInputRef,
    openImportPicker,
    onImportChange,
  } = useGalleryScreen();

  return (
    <SiteShell primaryAction={primaryAction}>
      <div className={galleryScreen.content}>
        <div className={galleryScreen.header}>
          <div className={galleryScreen.headingRow}>
            <div className={galleryScreen.titleGroup}>
              <h1 className={siteType.pageTitle}>{gallery.screen.heading}</h1>
              {loaded ? (
                <>
                  <span aria-hidden className={galleryScreen.count}>
                    {count}
                  </span>
                  <span className={galleryScreen.srOnly}>{countLabel}</span>
                </>
              ) : null}
            </div>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className={galleryScreen.importInput}
              onChange={onImportChange}
            />
            <Button
              type="button"
              variant="outline"
              aria-label={gallery.screen.importLabel}
              onClick={openImportPicker}
            >
              {gallery.screen.importFile}
            </Button>
          </div>
          <p
            role="status"
            className={cx(galleryScreen.note, galleryScreen.noteTone[storageNote.tone])}
          >
            {storageNote.tone === "progress" ? (
              <span aria-hidden className={galleryScreen.progressDot} />
            ) : null}
            {storageNote.text}
            <Link href="/help#saving" className={siteType.linkStandalone}>
              {gallery.screen.storageLink}
            </Link>
          </p>
        </div>

        {error ? (
          <p role="alert" className={galleryScreen.error}>
            {error}
          </p>
        ) : null}

        {showSkeleton ? (
          <GallerySkeleton />
        ) : (
          <GalleryGrid
            artworks={artworks}
            showEmpty={showEmpty}
            now={now}
            onRename={renameArtwork}
            onClone={cloneArtwork}
            onDelete={deleteArtwork}
            onCreate={openCreate}
            onImport={openImportPicker}
          />
        )}

        <CreateArtworkModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreate={createArtwork}
        />
      </div>
    </SiteShell>
  );
}
