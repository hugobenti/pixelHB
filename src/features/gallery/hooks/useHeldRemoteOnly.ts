/**
 * Purpose:
 * The Drive-only items the gallery shows: the engine's list plus any it just dropped because the
 * download landed, until the local list has caught up.
 *
 * Notes:
 * Once the sync pass ends, one local reload runs and only then is the hold released, so a finished
 * download is already in `local` and an item that never arrived (deleted in Drive, failed) goes.
 */
"use client";

import { useCallback, useEffect, useState } from "react";

import { holdRemoteOnly } from "@/features/gallery/logic/holdRemoteOnly";
import type { IArtworkSummary } from "@/features/shared/artwork/artwork.type";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";
import type { TSyncPhase } from "@/features/shared/sync/sync.type";
import { useSyncStore } from "@/features/shared/sync/useSyncStore";

export function useHeldRemoteOnly(
  remoteOnly: IGalleryListItem[],
  local: IArtworkSummary[],
  phase: TSyncPhase,
  reload: () => Promise<void>,
) {
  const [shown, setShown] = useState<IGalleryListItem[]>([]);
  const next = holdRemoteOnly(shown, remoteOnly, local);
  if (next !== shown) setShown(next);
  const holding = next.length > remoteOnly.length;

  const release = useCallback(() => setShown(useSyncStore.getState().remoteOnly), []);

  useEffect(() => {
    if (!holding || phase === "syncing") return;
    let cancelled = false;
    void reload().then(() => {
      if (!cancelled) release();
    });
    return () => {
      cancelled = true;
    };
  }, [holding, phase, reload, release]);

  return next;
}
