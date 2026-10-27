import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import type { IArtworkDeletion, IStoredArtwork } from "@/features/shared/artwork/artworkSync.type";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";
import type { IGalleryApiClient } from "@/features/shared/drive/galleryApiClient.type";

export type TSyncPhase = "disabled" | "idle" | "syncing" | "offline" | "reauth" | "error";

export interface ISyncStatus {
  phase: TSyncPhase;
  /** `countUnsynced`: dirty and too-large rows plus pending deletions. */
  pendingCount: number;
  /** Listed in Drive, not yet downloaded. */
  remoteOnly: IGalleryListItem[];
  tooLargeIds: string[];
  lastSyncedAt: number | null;
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
  markTooLarge(id: string): Promise<void>;
  putFromRemote(ownerId: string, artwork: IArtwork): Promise<void>;
  removeLocal(id: string): Promise<void>;
  listDeletions(ownerId: string): Promise<IArtworkDeletion[]>;
  dropDeletion(id: string): Promise<void>;
  adoptUnowned(ownerId: string): Promise<number>;
  countUnsynced(ownerId: string): Promise<number>;
}

export interface IArtworkPresence {
  /** Artworks currently open in an editor in any tab. */
  openIds(): Promise<ReadonlySet<string>>;
  /** Resolves once no editor holds the artwork open. */
  waitForRelease(id: string): Promise<void>;
  /** Serializes sync passes across tabs. */
  runExclusive<T>(task: () => Promise<T>): Promise<T>;
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
