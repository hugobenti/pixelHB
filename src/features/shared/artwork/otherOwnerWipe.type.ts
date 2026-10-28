import type { TArtworkSyncState } from "./artworkSync.type";

/** The part of a stored row the other-owner sweep decides on. */
export interface IOwnedRowBrief {
  id: string;
  ownerId: string | null;
  state: TArtworkSyncState;
}
