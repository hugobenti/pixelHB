/**
 * Purpose:
 * ArtworkCard behavior and view model: editor link, thumbnail, sync marker, inline rename, action menu and confirmed delete.
 */
"use client";

import { useState, type FormEvent } from "react";

import { gallery } from "@/content/gallery";
import { shared } from "@/content/shared";
import { relativeTimeParts } from "@/features/gallery/logic/relativeTime";
import { editorPath } from "@/features/gallery/logic/artworkLinks";
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
    deleteDialog,
  };
}
