/**
 * Purpose:
 * Decides what the app start does with a leftover "wipe this owner" marker.
 *
 * Notes:
 * Signed out: finish the wipe that sign-out started. Signed in as the marked owner: the marker is
 * stale (the user came back before the wipe ran), so it is dropped and the rows are kept. Signed in
 * as someone else: the marked owner's rows are wiped (by owner id, so this account's are safe).
 * Loading or disabled: wait.
 */
import type { TAccountStatus } from "@/features/shared/auth/auth.type";
import type { TPendingWipeAction } from "./pendingWipe.type";

export function decidePendingWipe(
  status: TAccountStatus,
  userId: string | null,
  markerOwnerId: string | null,
): TPendingWipeAction {
  if (markerOwnerId === null) return { kind: "none" };
  if (status === "signedOut") return { kind: "wipe", ownerId: markerOwnerId };
  if (status === "signedIn" && userId !== null) {
    return markerOwnerId === userId ? { kind: "clear" } : { kind: "wipe", ownerId: markerOwnerId };
  }
  return { kind: "none" };
}
