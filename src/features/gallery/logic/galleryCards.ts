/**
 * Purpose:
 * Merges the local artworks with the ones that exist only in Drive into gallery card view models.
 */
import type {
  IGalleryCard,
  TGalleryCardMarker,
} from "@/features/gallery/components/GalleryGrid.type";
import type { IArtworkSummary } from "@/features/shared/artwork/artwork.type";
import type { TArtworkSyncState } from "@/features/shared/artwork/artworkSync.type";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";
import { artworkThumbnail } from "./artworkLinks";

const MARKERS: Record<TArtworkSyncState, TGalleryCardMarker | null> = {
  local: null,
  synced: null,
  dirty: "notSynced",
  tooLarge: "tooLarge",
};

export function galleryCards(
  local: IArtworkSummary[],
  remoteOnly: IGalleryListItem[],
): IGalleryCard[] {
  const localIds = new Set(local.map((summary) => summary.id));
  const localCards = local.map((summary): IGalleryCard => ({
    id: summary.id,
    title: summary.title,
    width: summary.width,
    height: summary.height,
    updatedAt: summary.updatedAt,
    thumbnail: artworkThumbnail(summary.thumbnail),
    openable: true,
    marker: MARKERS[summary.syncState],
  }));
  /** The preview route needs the session cookie, which the image optimizer's server fetch lacks. */
  const remoteCards = remoteOnly
    .filter((item) => !localIds.has(item.id))
    .map((item): IGalleryCard => ({
      id: item.id,
      title: item.title,
      width: item.width,
      height: item.height,
      updatedAt: item.updatedAt,
      thumbnail: { src: item.previewUrl, unoptimized: true },
      openable: false,
      marker: "downloading",
    }));
  return [...localCards, ...remoteCards].sort((a, b) => b.updatedAt - a.updatedAt);
}
