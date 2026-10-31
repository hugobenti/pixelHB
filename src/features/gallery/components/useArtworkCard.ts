/**
 * Purpose:
 * ArtworkCard behavior and view model: editor link, thumbnail, sync marker, inline rename, action menu and confirmed delete.
 */
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { gallery } from "@/content/gallery";
import { shared } from "@/content/shared";
import { cardShareState } from "@/features/gallery/logic/cardShareState";
import { relativeTimeParts } from "@/features/gallery/logic/relativeTime";
import { editorPath } from "@/features/gallery/logic/artworkLinks";
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import * as artworkService from "@/features/shared/artwork/artworkService";
import { shareExportOptions } from "@/features/shared/artwork/exportScale";
import { usePreparedPng } from "@/features/shared/artwork/usePreparedPng";
import { useShareImage } from "@/features/shared/artwork/useShareImage";
import { useAccount } from "@/features/shared/auth/useAccount";
import type { IMenuItem } from "@/features/shared/components/Menu.type";
import { useConfirm } from "@/features/shared/components/useConfirm";
import type { IArtworkCardProps } from "./ArtworkCard.type";

const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function useArtworkCard({ artwork, now, onRename, onClone, onDelete }: IArtworkCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(artwork.title);
  const { confirm, dialog: deleteDialog } = useConfirm();
  const signedIn = useAccount().status === "signedIn";

  const [menuOpen, setMenuOpen] = useState(false);
  const [fullArtwork, setFullArtwork] = useState<IArtwork | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const { share, sharing } = useShareImage({ from: "gallery" });
  // Share always uses the shared rule (strip on, smallest scale reaching 1024 px), never a saved choice.
  const shareOptions = fullArtwork ? shareExportOptions(fullArtwork) : null;
  const shareScale = shareOptions?.scale ?? 1;
  const { png, failed: renderFailed } = usePreparedPng({
    artwork: fullArtwork,
    scale: shareScale,
    credit: shareOptions?.credit ?? true,
    active: menuOpen,
  });
  const shareState = cardShareState({ rendered: png !== null, failed: loadFailed || renderFailed });

  const artworkId = artwork.id;
  const openable = artwork.openable;
  const updatedAt = artwork.updatedAt;
  useEffect(() => {
    if (!menuOpen || !openable) return;
    let stale = false;
    artworkService.getArtwork(artworkId).then(
      (loaded) => {
        if (stale) return;
        if (loaded) setFullArtwork(loaded);
        else setLoadFailed(true);
      },
      () => {
        if (!stale) setLoadFailed(true);
      },
    );
    return () => {
      stale = true;
    };
  }, [menuOpen, openable, artworkId, updatedAt]);

  const onMenuOpenChange = useCallback((open: boolean) => {
    setMenuOpen(open);
    if (!open) {
      setFullArtwork(null);
      setLoadFailed(false);
    }
  }, []);

  const parts = relativeTimeParts(artwork.updatedAt, now);
  const edited = gallery.card.edited(
    parts ? relativeFormat.format(-parts.value, parts.unit) : gallery.card.justNow,
  );

  const cancelRename = () => {
    setTitle(artwork.title);
    setRenaming(false);
  };

  const submitRename = async (event: FormEvent) => {
    event.preventDefault();
    await onRename(artwork.id, title);
    setRenaming(false);
  };

  const confirmDelete = async () => {
    const confirmed = await confirm({
      title: gallery.deleteDialog.title(artwork.title),
      description: signedIn
        ? gallery.deleteDialog.descriptionSignedIn
        : gallery.deleteDialog.description,
      confirmLabel: gallery.deleteDialog.confirm,
    });
    if (confirmed) await onDelete(artwork.id);
  };

  const menuItems: IMenuItem[] = [
    { key: "rename", label: shared.actions.rename, onSelect: () => setRenaming(true) },
    {
      key: "share",
      label: {
        preparing: shared.share.preparing,
        ready: shared.share.label,
        failed: shared.artworkFile.errors.pngFailed,
      }[shareState],
      disabled: shareState !== "ready" || sharing,
      // Synchronous on purpose: the share sheet and clipboard need the click's user activation.
      onSelect: () => {
        if (png) void share(png, { scale: shareScale });
      },
    },
    { key: "clone", label: gallery.card.clone, onSelect: () => void onClone(artwork.id) },
    {
      key: "delete",
      label: gallery.card.delete,
      tone: "danger",
      onSelect: () => void confirmDelete(),
    },
  ];

  return {
    href: editorPath(artwork.id),
    thumbnail: artwork.thumbnail,
    frameOrientation: artwork.height > artwork.width ? ("tall" as const) : ("wide" as const),
    frameStyle: { aspectRatio: `${artwork.width} / ${artwork.height}` },
    openable: artwork.openable,
    marker: artwork.marker ? gallery.card[artwork.marker] : null,
    size: gallery.card.size(artwork.width, artwork.height),
    edited,
    renaming,
    setRenaming,
    title,
    setTitle,
    cancelRename,
    submitRename,
    menuItems,
    onMenuOpenChange,
    deleteDialog,
  };
}
