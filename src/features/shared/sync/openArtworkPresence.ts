/**
 * Purpose:
 * Browser side of editor presence, on Web Locks: an editor holds a shared lock per open artwork, the
 * engine reads cross-tab snapshots and waits for releases with exclusive requests.
 *
 * Notes:
 * The browser releases a lock when its tab closes or crashes, so presence never goes stale.
 * `navigator.locks` is read at call time, never at module load. Requests take an abort signal so the
 * engine's `stop()` can cancel a wait that has not been granted yet.
 */
import { openIdsFromLocks, openLockName, SYNC_LOCK_NAME } from "./logic/presenceLocks";
import type { IArtworkPresence } from "./sync.type";
import { isSyncSupported } from "./syncSupport";

/** Marks an artwork open in this tab; returns an idempotent release. A no-op without Web Locks. */
export function markArtworkOpen(id: string): () => void {
  if (!isSyncSupported()) return () => {};
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  void navigator.locks.request(openLockName(id), { mode: "shared" }, () => held);
  return release;
}

export function createLocksPresence(): IArtworkPresence {
  return {
    async openIds() {
      return openIdsFromLocks(await navigator.locks.query());
    },
    async waitForRelease(id, signal) {
      await navigator.locks.request(openLockName(id), { mode: "exclusive", signal }, async () => {});
    },
    runExclusive(task, signal) {
      return navigator.locks.request(SYNC_LOCK_NAME, { mode: "exclusive", signal }, task);
    },
  };
}
