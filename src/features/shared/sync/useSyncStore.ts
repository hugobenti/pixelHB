/**
 * Purpose:
 * Zustand store holding the sync engine's status for the UI.
 */
"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { INITIAL_SYNC_STATUS } from "./createSyncEngine";
import type { ISyncStatus, ISyncStoreState } from "./sync.type";

export const useSyncStore = create<ISyncStoreState>((set) => ({
  ...INITIAL_SYNC_STATUS,
  setStatus: (patch) => set(patch),
}));

export function useSyncStatus(): ISyncStatus {
  return useSyncStore(
    useShallow((state) => ({
      phase: state.phase,
      pendingCount: state.pendingCount,
      remoteOnly: state.remoteOnly,
      tooLargeIds: state.tooLargeIds,
      lastSyncedAt: state.lastSyncedAt,
    })),
  );
}
