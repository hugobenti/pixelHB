/**
 * Purpose:
 * Keeps a Drive-only artwork on screen after the engine stops listing it, until the loaded local
 * list contains it, so a finished download never leaves a gap between the two lists.
 *
 * Notes:
 * Items still listed use the current object. A held item that never arrives locally (deleted in
 * Drive, download failed) is released by the caller after a reload. Returns `shown` itself when
 * nothing changed, so callers can compare by reference.
 */
import type { IArtworkSummary } from "@/features/shared/artwork/artwork.type";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";

export function holdRemoteOnly(
  shown: IGalleryListItem[],
  remoteOnly: IGalleryListItem[],
  local: IArtworkSummary[],
): IGalleryListItem[] {
  const listed = new Set(remoteOnly.map((item) => item.id));
  const localIds = new Set(local.map((summary) => summary.id));
  const held = shown.filter((item) => !listed.has(item.id) && !localIds.has(item.id));
  const next = [...remoteOnly, ...held];
  const unchanged =
    next.length === shown.length && next.every((item, index) => item === shown[index]);
  return unchanged ? shown : next;
}
