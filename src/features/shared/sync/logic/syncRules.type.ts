import type { TArtworkSyncState } from "@/features/shared/artwork/artworkSync.type";

export interface ILocalSyncFacts {
  id: string;
  updatedAt: number;
  state: TArtworkSyncState;
}

/** `IGalleryListItem` satisfies it. */
export interface IRemoteSyncFacts {
  id: string;
  updatedAt: number;
}

export interface ISyncPlan {
  /** Newest Drive copy first. */
  downloads: string[];
  removals: string[];
  /** Oldest local edit first. */
  uploads: string[];
  deferred: string[];
}
