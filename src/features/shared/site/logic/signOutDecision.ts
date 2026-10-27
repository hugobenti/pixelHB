/**
 * Purpose:
 * Decides whether signing out can proceed at once or must ask first, from what is still unsynced.
 *
 * Notes:
 * Pure. Only `dirty` and `tooLarge` rows are unsynced; `local` rows never belong to an account.
 * An unreadable local database (`null`) asks rather than wiping blind.
 */
import type { IArtworkDeletion, IStoredArtwork } from "@/features/shared/artwork/artworkSync.type";
import type { IUnsyncedWork, TSignOutDecision } from "./signOutDecision.type";

export function summarizeUnsynced(
  owned: IStoredArtwork[],
  deletions: IArtworkDeletion[],
): IUnsyncedWork {
  return {
    artworks: owned
      .filter((row) => row.sync.state === "dirty" || row.sync.state === "tooLarge")
      .sort((a, b) => b.updatedAt - a.updatedAt),
    deletionCount: deletions.length,
  };
}

export function decideSignOut(work: IUnsyncedWork | null): TSignOutDecision {
  return work !== null && work.artworks.length === 0 && work.deletionCount === 0
    ? "signOutNow"
    : "askUser";
}
