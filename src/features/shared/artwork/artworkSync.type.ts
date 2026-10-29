import type { IArtwork } from "./artwork.type";

export type TArtworkSyncState = "local" | "dirty" | "synced" | "tooLarge";

export interface IArtworkSyncState {
  state: TArtworkSyncState;
  /** `updatedAt` of the version last confirmed in Drive; null when never synced. */
  syncedUpdatedAt: number | null;
}

/** Row as persisted in IndexedDB: the artwork plus its owner and sync bookkeeping. */
export interface IStoredArtwork extends IArtwork {
  ownerId: string | null;
  sync: IArtworkSyncState;
}

/** Tombstone for an artwork deleted locally after it had been synced. */
export interface IArtworkDeletion {
  id: string;
  ownerId: string;
  deletedAt: number;
}

/** The local row an engine write was decided on; the write only lands while the row still looks like this. */
export interface ISyncExpectedRow {
  ownerId: string | null;
  updatedAt: number;
  state: TArtworkSyncState;
}

/** A synced row the engine removed because Drive trashed it; kept locally for a while so it can be restored. */
export interface IRemovedArtwork extends IStoredArtwork {
  removedAt: number;
}
