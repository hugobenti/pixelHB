/**
 * Purpose:
 * The two pure checks a local copy must pass before the engine may remove it because Drive no longer
 * lists it: positive evidence that Drive trashed it after our last sync, and a brake against a pass
 * that would remove a large share of the gallery at once.
 *
 * Notes:
 * Absence from the Drive list alone proves nothing: a lagging or short answer, a lost scope or a
 * trashed folder all look the same. Only a trashed copy at least as new as the version we last synced
 * is a deletion; an older trashed copy is a duplicate Drive tidied up. The brake applies even to
 * confirmed deletions, since trashing the whole PixelHB folder by mistake confirms every one.
 */
import type { IGalleryStatusResponse } from "@/features/shared/drive/galleryApi.type";
import type { IRemovalBrakeInput } from "./removalSafety.type";

export const MIN_BRAKE_REMOVALS = 3;
/** The brake also trips when removals reach this share of the synced rows (as `removals * 2 >= synced`). */
const BRAKE_SHARE_DENOMINATOR = 2;

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

export function shouldBrakeRemovals({
  removalCount,
  syncedCount,
  remoteListEmpty,
}: IRemovalBrakeInput): boolean {
  if (removalCount === 0) return false;
  if (remoteListEmpty) return true;
  return (
    removalCount >= MIN_BRAKE_REMOVALS && removalCount * BRAKE_SHARE_DENOMINATOR >= syncedCount
  );
}
