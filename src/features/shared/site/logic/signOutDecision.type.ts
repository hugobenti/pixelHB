import type { IStoredArtwork } from "@/features/shared/artwork/artworkSync.type";

export type TSignOutDecision = "signOutNow" | "askUser";

export interface IUnsyncedWork {
  /** Artworks whose latest version is not in Drive, newest first. */
  artworks: IStoredArtwork[];
  /** Deletions (tombstones) not yet applied in Drive; they have nothing to download. */
  deletionCount: number;
}
