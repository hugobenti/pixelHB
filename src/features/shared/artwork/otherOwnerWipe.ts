/**
 * Purpose:
 * Plans which rows to wipe when a different Google account signs in on a browser that still holds
 * another account's local copies (their session was lost without the sign-out flow).
 *
 * Notes:
 * Only `synced` rows of other string owners are returned: a Drive copy exists, so removing the
 * local one loses nothing. `dirty` and `tooLarge` rows hold work that is not in Drive, signed-out
 * rows (`ownerId: null`) are not anyone's, and a row whose id still has a tombstone is left as it
 * is. Tombstones themselves are never touched here.
 */
import type { IOwnedRowBrief } from "./otherOwnerWipe.type";

export function planOtherOwnerWipe(
  currentOwnerId: string,
  rows: readonly IOwnedRowBrief[],
  tombstonedIds: ReadonlySet<string>,
): string[] {
  return rows
    .filter(
      (row) =>
        row.ownerId !== null &&
        row.ownerId !== currentOwnerId &&
        row.state === "synced" &&
        !tombstonedIds.has(row.id),
    )
    .map((row) => row.id);
}
