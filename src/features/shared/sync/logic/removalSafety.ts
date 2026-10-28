/**
 * Purpose:
 * The pure checks a local copy must pass before the engine may remove it because Drive no longer
 * lists it: positive per-row evidence that Drive trashed it after our last sync, and the two cases
 * where that evidence cannot be trusted.
 *
 * Notes:
 * Absence from the Drive list alone proves nothing: a lagging or short answer, a lost scope or a
 * trashed folder all look the same. Only a trashed copy at least as new as the version we last synced
 * is a deletion; an older trashed copy is a duplicate Drive tidied up. Removals proceed row by row on
 * that evidence, however many there are (deleting several artworks on another device is legitimate).
 * The brake covers the one case where trashed evidence is not the user's per-artwork choice:
 * `folderTrashed`, the PixelHB folder itself is in the Drive trash (and no live one exists), so every
 * child inherits `trashed` (one gesture, not N deletions). A braked pass applies nothing.
 * An empty Drive list needs no brake of its own: it proves nothing either way, and without a
 * trashed copy for a row (lost scope, broken answer, deleted forever) the row is kept as missing.
 * Known gap: when the folder was trashed and the app has since created a new live folder, the old
 * files still inherit `trashed` and are removed (into the local removed table, restorable 30 days).
 */
import type { IGalleryStatusResponse } from "@/features/shared/drive/galleryApi.type";
import type { IRemovalBrakeInput, TRemovalBrake } from "./removalSafety.type";

export function isDeletionConfirmed(
  status: IGalleryStatusResponse,
  syncedUpdatedAt: number | null,
): boolean {
  return (
    status.state === "trashed" &&
    status.updatedAt !== undefined &&
    syncedUpdatedAt !== null &&
    status.updatedAt >= syncedUpdatedAt
  );
}

export function removalBrake({ removalCount, rootFolderTrashed }: IRemovalBrakeInput): TRemovalBrake | null {
  return removalCount > 0 && rootFolderTrashed ? "folderTrashed" : null;
}
