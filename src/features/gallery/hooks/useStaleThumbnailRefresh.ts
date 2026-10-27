/**
 * Purpose:
 * Regenerates gallery thumbnails saved by the old renderer (fractional scale, seams between pixels)
 * from the artwork's pixel data, so every card shows the art without grid lines.
 *
 * Notes:
 * Runs after the list loads and only touches stale thumbnails; a regenerated one passes
 * isThumbnailCurrent, so it is rendered once. Artworks saved since the PNG renderer are skipped.
 */
"use client";

import { useEffect, useRef } from "react";

import type { IArtworkSummary } from "@/features/shared/artwork/artwork.type";
import * as artworkService from "@/features/shared/artwork/artworkService";
import { artworkToPngThumbnail } from "@/features/shared/artwork/thumbnail";
import { isThumbnailCurrent } from "@/features/shared/artwork/thumbnailFreshness";

export function useStaleThumbnailRefresh(
  artworks: readonly IArtworkSummary[],
  updateThumbnail: (id: string, thumbnail: string) => Promise<void>,
): void {
  // Ids already fetched this visit: updateThumbnail replaces the list and re-runs the effect.
  const requested = useRef<Set<string>>(new Set());
  // Set by a mount effect, not per-run: the refresh effect re-runs on every list change and must not
  // abort tasks still in flight.
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    for (const summary of artworks) {
      if (
        isThumbnailCurrent(summary.thumbnail, summary.width, summary.height) ||
        requested.current.has(summary.id)
      ) {
        continue;
      }
      requested.current.add(summary.id);
      void (async () => {
        try {
          const full = await artworkService.getArtwork(summary.id);
          if (!full || !mounted.current) {
            requested.current.delete(summary.id);
            return;
          }
          const thumbnail = artworkToPngThumbnail(full);
          if (thumbnail) {
            await updateThumbnail(summary.id, thumbnail);
          }
        } catch {
          // The thumbnail is regenerated on the next load; release the id so a later pass can retry.
          requested.current.delete(summary.id);
        }
      })();
    }
  }, [artworks, updateThumbnail]);
}
