/**
 * Purpose:
 * Decides what the app start does with a leftover "wipe this owner" marker.
 *
 * Notes:
 * Signed out: finish the wipe that sign-out started. Signed in as the marked owner: the marker is
 * stale (the user came back before the wipe ran), so it is dropped and the rows are kept. Signed in
 * as someone else: the marked owner's rows are wiped (by owner id, so this account's are safe).
 * Loading, disabled or provisional (a guess made while the server could not be asked): wait, see
 * `isAccountSettled`.
 */
import type { IAccountState, TAccountStatus } from "@/features/shared/auth/auth.type";
import type { TPendingWipeAction } from "./pendingWipe.type";

/** True only for a state the server confirmed: nothing destructive may run on any other. */
export function isAccountSettled(account: Pick<IAccountState, "status" | "provisional">): boolean {
  return (account.status === "signedIn" || account.status === "signedOut") && !account.provisional;
}

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
