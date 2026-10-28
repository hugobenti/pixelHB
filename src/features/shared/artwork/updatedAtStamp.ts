/**
 * Purpose:
 * The `updatedAt` a local edit gets, and the `deletedAt` a local delete gets.
 *
 * Notes:
 * The wall clock alone is not safe: a clock stepped back (or a stamp from a fast clock) would give an
 * edit a smaller `updatedAt` than the stored row, Drive would refuse it as a conflict and the older
 * content would come back. So an edit goes at least one past the stored stamp. The exception is a
 * stamp more than the server's tolerance ahead of the clock that Drive never accepted: the server
 * refuses those, so outranking it would keep refusing every later edit; such an edit restarts from
 * the clock (never below the version Drive does hold). A stamp Drive already holds is always outranked.
 */
import { MAX_CLOCK_SKEW_MS } from "@/features/shared/drive/galleryApi";
import type { IStoredArtwork } from "./artworkSync.type";

export function nextUpdatedAt(
  nowMs: number,
  stored: Pick<IStoredArtwork, "updatedAt" | "sync">,
): number {
  const { syncedUpdatedAt } = stored.sync;
  const unaccepted =
    stored.updatedAt > nowMs + MAX_CLOCK_SKEW_MS && stored.updatedAt !== syncedUpdatedAt;
  const floor = unaccepted ? (syncedUpdatedAt ?? -1) + 1 : stored.updatedAt + 1;
  return Math.max(nowMs, floor);
}

/** A tombstone must not be older than the version Drive holds, or the delete reads as a conflict and is undone. */
export function deletionStamp(nowMs: number, syncedUpdatedAt: number | null): number {
  return Math.max(nowMs, syncedUpdatedAt ?? 0);
}
