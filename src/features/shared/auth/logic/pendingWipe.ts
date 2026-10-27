/**
 * Purpose:
 * Decides what the app start does with a leftover "wipe this owner" marker.
 *
 * Notes:
 * Signed out: finish the wipe that sign-out started. Signed in: the marker is stale (the user came
 * back before the wipe ran), so it is dropped without deleting anything. Loading: wait.
 */
import type { TAccountStatus } from "@/features/shared/auth/auth.type";
import type { TPendingWipeAction } from "./pendingWipe.type";

export function decidePendingWipe(
  status: TAccountStatus,
  markerOwnerId: string | null,
): TPendingWipeAction {
  if (markerOwnerId === null) return { kind: "none" };
  if (status === "signedOut") return { kind: "wipe", ownerId: markerOwnerId };
  if (status === "signedIn") return { kind: "clear" };
  return { kind: "none" };
}
