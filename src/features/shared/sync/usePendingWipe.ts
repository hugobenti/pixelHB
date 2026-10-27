/**
 * Purpose:
 * Finishes a sign-out wipe that did not complete: when the app starts (or the session ends) signed
 * out with a pending-wipe marker, removes that owner's local copies and then the marker.
 *
 * Notes:
 * A failed wipe leaves the marker for the next start. Signed in, a stale marker is just dropped.
 * Runs once per page load, so a sign-out in this tab (which has its own wipe) is not raced. Runs only with Drive sync on (the status is `disabled` otherwise).
 */
"use client";

import { useEffect, useRef } from "react";

import { wipeOwner } from "@/features/shared/artwork/artworkSyncStore";
import { decidePendingWipe } from "@/features/shared/auth/logic/pendingWipe";
import { clearPendingWipe, readPendingWipe } from "@/features/shared/auth/pendingWipeMarker";
import { useAccount } from "@/features/shared/auth/useAccount";

export function usePendingWipe(): void {
  const { status } = useAccount();
  const swept = useRef(false);

  useEffect(() => {
    if (swept.current || status === "loading" || status === "disabled") return;
    swept.current = true;
    const action = decidePendingWipe(status, readPendingWipe());
    if (action.kind === "clear") {
      clearPendingWipe();
    } else if (action.kind === "wipe") {
      wipeOwner(action.ownerId).then(clearPendingWipe, () => {
        console.error("Couldn't remove a signed-out account's local copies; will retry next start");
      });
    }
  }, [status]);
}
