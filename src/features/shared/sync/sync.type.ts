import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import type { IArtworkDeletion, ISyncExpectedRow, IStoredArtwork } from "@/features/shared/artwork/artworkSync.type";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";
import type { IGalleryApiClient, TApiResult } from "@/features/shared/drive/galleryApiClient.type";

export type TSyncPhase = "disabled" | "idle" | "syncing" | "offline" | "reauth" | "error";

export interface ISyncStatus {
  phase: TSyncPhase;
  /** `countUnsynced`: dirty and too-large rows plus pending deletions. */
  pendingCount: number;
  /** Listed in Drive, not yet downloaded. */
  remoteOnly: IGalleryListItem[];
  tooLargeIds: string[];
  lastSyncedAt: number | null;
  /**
   * Synced rows the last full pass kept on this device because Drive does not hold a live copy and
   * has no trashed one proving a deletion (gone for good, or an empty answer). The user can delete them here.
   */
  missingInDriveIds: string[];
  /** The PixelHB folder is in the Drive trash: nothing is removed until it is restored. */
  driveFolderTrashed: boolean;
  /** Artworks the server refused because this device's clock is ahead of it. */
  clockSkewIds: string[];
}

export type TSyncPassKind = "full" | "push";

export type TSyncApiFailure = Extract<TApiResult<never>, { ok: false }>;

/** What happened to one Drive copy the engine tried to apply locally. */
export type TSyncApplyOutcome = "written" | "deferred" | "skipped";

/** Per-pass state shared by the pull and push helpers. */
export interface ISyncPassContext {
  owner: string;
  gen: number;
  signal: AbortSignal;
  /** Ids whose destructive write waits for an editor to close. */
  deferredIds: Set<string>;
  /** Ids whose push failed for a reason that is theirs alone; the pass goes on without them. */
  failedIds: Set<string>;
  hooks: ISyncPullHooks;
}

/** What the removal step of a full pass found. */
export interface IRemovalOutcome {
  missingIds: string[];
  folderTrashed: boolean;
  /** Candidates are left that the status budget did not reach: another pass should follow soon. */
  incomplete: boolean;
}

export interface ISyncPullHooks {
  /** True once the caller gave up or the engine stopped: nothing may be written. */
  isStale(): boolean;
  onFailure(result: TSyncApiFailure): void;
}

export type TPullAction = "download" | "upload" | "removeLocal" | "defer" | "none";

export interface ISyncEngine {
  /** Adopts unowned rows and runs the first full pass. Same owner is a no-op; another owner stops first. */
  start(ownerId: string): Promise<void>;
  /** Idempotent; resolves after the in-flight pass settles, and no store write lands after it. */
  stop(): Promise<void>;
  /** Never rejects. */
  syncNow(): Promise<void>;
  /** Pushes everything pending; never rejects, resolves after `timeoutMs` at the latest. */
  flush(timeoutMs: number): Promise<void>;
  /** Downloads only when Drive is newer; never rejects, gives up after `timeoutMs`. */
  refreshOne(id: string, timeoutMs: number): Promise<void>;
  /** Fires after every engine write to IndexedDB. */
  onLocalRowsChanged(listener: () => void): () => void;
}

export interface ISyncLocalStore {
  getStored(id: string): Promise<IStoredArtwork | undefined>;
  listOwned(ownerId: string): Promise<IStoredArtwork[]>;
  listDirty(ownerId: string): Promise<IStoredArtwork[]>;
  markSynced(id: string, syncedUpdatedAt: number): Promise<void>;
  /** Only marks the version that was pushed; resolves whether it marked. */
  markTooLarge(id: string, pushedUpdatedAt: number): Promise<boolean>;
  /** Conditional on the local row still matching `expected` (`undefined`: still absent); resolves whether it wrote. */
  putFromRemote(ownerId: string, artwork: IArtwork, expected: ISyncExpectedRow | undefined): Promise<boolean>;
  /** Conditional on the local row still matching `expected`; moves it to the removed table and resolves whether it did. */
  removeLocal(id: string, expected: ISyncExpectedRow, removedAt: number): Promise<boolean>;
  /** Drops rows removed before `cutoff`; resolves with how many. */
  purgeRemoved(cutoff: number): Promise<number>;
  listDeletions(ownerId: string): Promise<IArtworkDeletion[]>;
  dropDeletion(id: string): Promise<void>;
  adoptUnowned(ownerId: string): Promise<number>;
  countUnsynced(ownerId: string): Promise<number>;
}

export interface IArtworkPresence {
  /** Artworks currently open in an editor in any tab. */
  openIds(): Promise<ReadonlySet<string>>;
  /** Resolves once no editor holds the artwork open; rejects when `signal` aborts first. */
  waitForRelease(id: string, signal: AbortSignal): Promise<void>;
  /**
   * Serializes sync passes across tabs. Aborting `signal` cancels a request still waiting for the
   * lock (it rejects); a task that already started is not interrupted.
   */
  runExclusive<T>(task: () => Promise<T>, signal: AbortSignal): Promise<T>;
}

export interface ISyncEnvironment {
  isOnline(): boolean;
  onOnline(listener: () => void): () => void;
  onHidden(listener: () => void): () => void;
}

export interface ISyncTimers {
  /** Returns the cancel function. */
  after(ms: number, callback: () => void): () => void;
}

export interface ISyncEngineDeps {
  api: IGalleryApiClient;
  store: ISyncLocalStore;
  presence: IArtworkPresence;
  environment: ISyncEnvironment;
  timers: ISyncTimers;
  now(): number;
  setStatus(patch: Partial<ISyncStatus>): void;
  onArtworkChanged(listener: (id: string) => void): () => void;
  renderThumbnail(artwork: Pick<IArtwork, "width" | "height" | "layers" | "palette">): string;
  warn(message: string, id: string): void;
}

export interface ISyncStoreState extends ISyncStatus {
  setStatus(patch: Partial<ISyncStatus>): void;
}
