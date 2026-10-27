/**
 * Purpose:
 * Web Locks names for editor presence and the sync pass, and reading open artworks from a snapshot.
 *
 * Notes:
 * Editors hold a shared lock per artwork. The engine's own exclusive wait for a release is not
 * presence, so only shared locks count.
 */
export const OPEN_LOCK_PREFIX = "pixelhb:open:";
export const SYNC_LOCK_NAME = "pixelhb:sync";

export function openLockName(id: string): string {
  return `${OPEN_LOCK_PREFIX}${id}`;
}

export function openIdsFromLocks(snapshot: Partial<Pick<LockManagerSnapshot, "held" | "pending">>): Set<string> {
  const ids = new Set<string>();
  for (const lock of [...(snapshot.held ?? []), ...(snapshot.pending ?? [])]) {
    if (lock.mode === "shared" && lock.name?.startsWith(OPEN_LOCK_PREFIX)) {
      ids.add(lock.name.slice(OPEN_LOCK_PREFIX.length));
    }
  }
  return ids;
}
