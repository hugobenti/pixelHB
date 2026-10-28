/**
 * Purpose:
 * Finishes a sign-out wipe that did not complete: when the app starts (or the session ends) signed
 * out with a pending-wipe marker, removes that owner's local copies and then the marker.
 *
 * Notes:
 * A failed wipe shows a toast and leaves the marker for the next start. A marker of the signed-in
 * account is dropped; one of another account is wiped.
 * When an account is signed in, the synced copies of other accounts left on disk (their session
 * ended without the sign-out flow) are wiped once per owner id: they are safe in Drive; unsynced
 * rows and tombstones of other accounts stay. A failed sweep is silent and retried next load.
 * The marker check runs once per page load, so a sign-out in this tab (which has its own wipe) is not raced. Runs only with Drive sync on (the status is `disabled` otherwise).
 */
"use client";

import { useEffect, useRef } from "react";

import { shell } from "@/content/shell";
import { wipeOwner, wipeSyncedRowsOfOtherOwners } from "@/features/shared/artwork/artworkSyncStore";
import { decidePendingWipe } from "@/features/shared/auth/logic/pendingWipe";
import { clearPendingWipe, readPendingWipe } from "@/features/shared/auth/pendingWipeMarker";
import { useAccount } from "@/features/shared/auth/useAccount";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";

export function usePendingWipe(): void {
  const { status, user } = useAccount();
  const { showToast } = useToast();
  const userId = user?.id ?? null;
  const swept = useRef(false);
  const sweptOwner = useRef<string | null>(null);

  useEffect(() => {
    if (swept.current || status === "loading" || status === "disabled") return;
    if (status === "signedIn" && userId === null) return;
    swept.current = true;
    const action = decidePendingWipe(status, userId, readPendingWipe());
    if (action.kind === "clear") {
      clearPendingWipe();
    } else if (action.kind === "wipe") {
      wipeOwner(action.ownerId).then(clearPendingWipe, () => {
        showToast({ message: shell.account.signOutDialog.wipeFailed, tone: "error" });
      });
    }
  }, [status, userId, showToast]);

  useEffect(() => {
    if (status !== "signedIn" || userId === null || sweptOwner.current === userId) return;
    sweptOwner.current = userId;
    wipeSyncedRowsOfOtherOwners(userId).catch(() => {
      // Best effort: the rows are still safe in Drive and the next page load sweeps again.
    });
  }, [status, userId]);
}
