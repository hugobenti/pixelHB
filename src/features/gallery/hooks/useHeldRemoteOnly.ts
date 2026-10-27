/**
 * Purpose:
 * The Drive-only items the gallery shows: the engine's list plus any it just dropped because the
 * download landed, until the local list has caught up.
 *
 * Notes:
 * `release` resets to the engine's list; call it once a local reload has finished, so an item that
 * left Drive without ever arriving locally does not stay on screen.
 */
"use client";

import { useState } from "react";

import { holdRemoteOnly } from "@/features/gallery/logic/holdRemoteOnly";
import type { IArtworkSummary } from "@/features/shared/artwork/artwork.type";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";

export function useHeldRemoteOnly(remoteOnly: IGalleryListItem[], local: IArtworkSummary[]) {
  const [shown, setShown] = useState<IGalleryListItem[]>([]);
  const next = holdRemoteOnly(shown, remoteOnly, local);
  if (next !== shown) setShown(next);
  return { items: next, release: (current: IGalleryListItem[]) => setShown(current) };
}
