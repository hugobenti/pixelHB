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

import { useLayoutEffect } from "react";

import * as artworkService from "@/features/shared/artwork/artworkService";
import { useAccount } from "@/features/shared/auth/useAccount";
import { getSyncEngine, isDriveSyncSupported } from "./syncEngine";

export function useDriveSync(): void {
  const { status, user, provisional } = useAccount();
  const userId = user?.id;

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
