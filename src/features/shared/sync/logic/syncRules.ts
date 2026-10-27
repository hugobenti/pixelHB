/**
 * Purpose:
 * Pure sync decisions: what to do with one artwork given its local and Drive copies, how to order a
 * pass, and the retry backoff.
 *
 * Notes:
 * Spec §4.6: the most recent `updatedAt` wins and a tie goes to Drive. `syncedUpdatedAt` is not an
 * input. Only a destructive action on an artwork open in an editor is deferred.
 */
import type { TPullAction } from "@/features/shared/sync/sync.type";
import type { ILocalSyncFacts, IRemoteSyncFacts, ISyncPlan } from "./syncRules.type";

export const MAX_BACKOFF_MS = 300_000;

function baseAction(local: ILocalSyncFacts, remote: IRemoteSyncFacts | undefined): TPullAction {
  if (!remote) {
    if (local.state === "synced") return "removeLocal";
    return local.state === "tooLarge" ? "none" : "upload";
  }
  if (remote.updatedAt > local.updatedAt) return "download";
  if (remote.updatedAt === local.updatedAt) {
    return local.state === "synced" ? "none" : "download";
  }
  return local.state === "tooLarge" ? "none" : "upload";
}

export function decidePull(
  local: ILocalSyncFacts | undefined,
  remote: IRemoteSyncFacts | undefined,
  isOpen: boolean,
): TPullAction {
  if (!local) return remote ? "download" : "none";
  const action = baseAction(local, remote);
  return isOpen && (action === "removeLocal" || action === "download") ? "defer" : action;
}

const byId = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function planSync(
  locals: readonly ILocalSyncFacts[],
  remotes: readonly IRemoteSyncFacts[],
  openIds: ReadonlySet<string>,
): ISyncPlan {
  const localById = new Map(locals.map((l) => [l.id, l]));
  const remoteById = new Map(remotes.map((r) => [r.id, r]));
  const ids = new Set([...localById.keys(), ...remoteById.keys()]);
  const downloads: IRemoteSyncFacts[] = [];
  const uploads: ILocalSyncFacts[] = [];
  const removals: string[] = [];
  const deferred: string[] = [];
  for (const id of ids) {
    const local = localById.get(id);
    const remote = remoteById.get(id);
    const action = decidePull(local, remote, openIds.has(id));
    if (action === "download" && remote) downloads.push(remote);
    else if (action === "upload" && local) uploads.push(local);
    else if (action === "removeLocal") removals.push(id);
    else if (action === "defer") deferred.push(id);
  }
  return {
    downloads: downloads.sort((a, b) => b.updatedAt - a.updatedAt || byId(a.id, b.id)).map((r) => r.id),
    removals: removals.sort(byId),
    uploads: uploads.sort((a, b) => a.updatedAt - b.updatedAt || byId(a.id, b.id)).map((l) => l.id),
    deferred: deferred.sort(byId),
  };
}

/** Dirty rows oldest first (id breaks ties), without too-large and deferred rows. */
export function planPush(dirty: readonly ILocalSyncFacts[], skipIds: ReadonlySet<string>): string[] {
  return dirty
    .filter((row) => row.state !== "tooLarge" && !skipIds.has(row.id))
    .sort((a, b) => a.updatedAt - b.updatedAt || byId(a.id, b.id))
    .map((row) => row.id);
}

export function nextBackoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
}

export function retryDelayMs(attempt: number, retryAfterMs: number | null): number {
  return Math.min(Math.max(nextBackoffMs(attempt), retryAfterMs ?? 0), MAX_BACKOFF_MS);
}
