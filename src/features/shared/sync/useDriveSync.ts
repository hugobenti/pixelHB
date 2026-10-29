/**
 * Purpose:
 * Ties the sync engine to the signed-in account: sets the artwork service's active owner and
 * starts/stops the engine as the account changes.
 *
 * Notes:
 * A layout effect on purpose: React runs every layout effect of a commit before any passive effect,
 * so the owner is set before the editor's or gallery's `useEffect` reads Dexie. Without Drive sync
 * (flag off or no Web Locks) nothing here runs and the app is local-only as before.
 */
"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

import * as artworkService from "@/features/shared/artwork/artworkService";
import { useAccount } from "@/features/shared/auth/useAccount";
import { shouldResyncAfterReauth } from "./logic/reauthRecovery";
import { getSyncEngine, isDriveSyncSupported } from "./syncEngine";

export function useDriveSync(): void {
  const { status, user, provisional, needsReauth } = useAccount();
  const userId = user?.id;
  const previousNeedsReauth = useRef<boolean | undefined>(undefined);

  // The engine stops retrying while Drive access needs a new sign-in. When it no longer does (signed
  // in again in another tab), nothing else would restart it, so ask for a full pass.
  useEffect(() => {
    const recovered = shouldResyncAfterReauth(previousNeedsReauth.current, needsReauth);
    previousNeedsReauth.current = needsReauth;
    if (recovered && isDriveSyncSupported()) void getSyncEngine().syncNow();
  }, [needsReauth]);

  useLayoutEffect(() => {
    if (!isDriveSyncSupported() || status === "loading") return;
    if (status === "signedIn" && userId) {
      artworkService.setActiveOwner(userId);
      // A provisional owner is a guess (the session request failed): show their local drawings, but
      // start the engine (and its adoption of signed-out drawings) only once the server confirms.
      if (provisional) return;
      void getSyncEngine().start(userId);
      return () => {
        void getSyncEngine().stop();
      };
    }
    artworkService.setActiveOwner(null);
  }, [status, userId, provisional]);
}
