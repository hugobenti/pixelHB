/**
 * Purpose:
 * The rule for the "Drive is full" flag, so it neither sticks after the cause is gone nor hides
 * another failure.
 *
 * Notes:
 * Set only by a refused upload. Cleared by an upload that succeeded, by any failure with another
 * cause (offline, sign-in, Drive error), and by a pass that tried no upload once nothing is left
 * pending (a stale flag would claim a problem that blocks nothing).
 */
import type { TDriveFullEvent } from "./driveFullState.type";

export function nextDriveFull(
  previous: boolean,
  event: TDriveFullEvent,
  pendingCount: number,
): boolean {
  switch (event) {
    case "driveFull":
      return true;
    case "uploaded":
    case "otherFailure":
      return false;
    case "noUpload":
      return previous && pendingCount > 0;
  }
}
