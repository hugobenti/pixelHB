/**
 * Purpose:
 * The Drive sync engine: pulls newer Drive copies, pushes local edits and deletions, and keeps the
 * sync status current. Built only from injected dependencies so it runs in Node tests.
 *
 * Notes:
 * - The most recent `updatedAt` wins, a tie goes to Drive (`decidePull`).
 * - Passes are single-flight per tab and run inside `presence.runExclusive` (one pass across tabs).
 * - Every store write and status update is preceded by a generation check, so after `stop()` nothing
 *   lands. Destructive writes also re-read the row and re-check presence right before writing.
 * - Offline, reauth and Drive errors abort the pass and never delete or overwrite anything.
 */
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import { serializeArtworkFile } from "@/features/shared/artwork/artworkFileFormat";
import type { IStoredArtwork } from "@/features/shared/artwork/artworkSync.type";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";
import { pngBase64FromDataUrl, remoteFileToArtwork } from "./logic/remoteArtwork";
import { decidePull, planPush, planSync, retryDelayMs } from "./logic/syncRules";
import type { ILocalSyncFacts } from "./logic/syncRules.type";
import type {
  ISyncEngine,
  ISyncEngineDeps,
  ISyncPullHooks,
  ISyncStatus,
  TSyncApiFailure,
  TSyncApplyOutcome,
  TSyncPassKind,
  TSyncPhase,
} from "./sync.type";

export const PUSH_DEBOUNCE_MS = 10_000;

export const INITIAL_SYNC_STATUS: ISyncStatus = {
  phase: "disabled",
  pendingCount: 0,
  remoteOnly: [],
  tooLargeIds: [],
  lastSyncedAt: null,
};

/** Thrown to unwind a pass that was stopped or already reported its failure. */
class PassAbort extends Error {}

const toFacts = (row: IStoredArtwork): ILocalSyncFacts => ({
  id: row.id,
  updatedAt: row.updatedAt,
  state: row.sync.state,
});

export function createSyncEngine(deps: ISyncEngineDeps): ISyncEngine {
  const { api, store, presence, environment, timers } = deps;

  let ownerId: string | null = null;
  let generation = 0;
  let attempt = 0;
  let phase: TSyncPhase = "disabled";
  let remoteOnly: IGalleryListItem[] = [];
  let adoptPending = false;
  let queued: TSyncPassKind | null = null;
  let waiters: Array<() => void> = [];
  let loop: Promise<void> | null = null;
  let currentPass: Promise<void> = Promise.resolve();
  let debounceCancel: (() => void) | null = null;
  let retryCancel: (() => void) | null = null;
  let unsubscribers: Array<() => void> = [];
  const deferred = new Set<string>();
  const tooLarge = new Set<string>();
  const rowListeners = new Set<() => void>();

  function guard(gen: number): void {
    if (gen !== generation) throw new PassAbort();
  }

  function update(gen: number, patch: Partial<ISyncStatus>): void {
    guard(gen);
    if (patch.phase) phase = patch.phase;
    deps.setStatus(patch);
  }

  function emitRows(gen: number): void {
    guard(gen);
    for (const listener of rowListeners) {
      try {
        listener();
      } catch {
        // A failing listener must not abort a pass whose write already landed.
      }
    }
  }

  function cancelRetry(): void {
    retryCancel?.();
    retryCancel = null;
  }

  function cancelDebounce(): void {
    debounceCancel?.();
    debounceCancel = null;
  }

  function scheduleRetry(gen: number, delayMs: number): void {
    cancelRetry();
    retryCancel = timers.after(delayMs, () => {
      retryCancel = null;
      if (gen === generation) void request("full");
    });
  }

  /** Reports an API failure, schedules the retry the failure calls for, and unwinds the pass. */
  function fail(gen: number, result: TSyncApiFailure): never {
    guard(gen);
    switch (result.kind) {
      case "reauth":
      case "unauthenticated":
        cancelRetry();
        update(gen, { phase: "reauth" });
        break;
      case "offline":
        update(gen, { phase: "offline" });
        scheduleRetry(gen, retryDelayMs(attempt++, null));
        break;
      case "retry":
        update(gen, { phase: "error" });
        scheduleRetry(gen, retryDelayMs(attempt++, result.retryAfterMs));
        break;
      default:
        update(gen, { phase: "error" });
        scheduleRetry(gen, retryDelayMs(attempt++, null));
    }
    throw new PassAbort();
  }

  function dropRemoteOnly(gen: number, id: string): void {
    if (!remoteOnly.some((item) => item.id === id)) return;
    remoteOnly = remoteOnly.filter((item) => item.id !== id);
    update(gen, { remoteOnly });
  }

  function safeThumbnail(artwork: Pick<IArtwork, "width" | "height" | "layers" | "palette">): string {
    try {
      return deps.renderThumbnail(artwork);
    } catch {
      return "";
    }
  }

  /**
   * Fetches one Drive copy and applies it. The decision is re-made on the freshest local row and
   * presence right before the write: a GET can take seconds, during which the user may have edited
   * the row or an editor may have opened it.
   */
  async function pullOne(
    owner: string,
    gen: number,
    id: string,
    hooks: ISyncPullHooks,
  ): Promise<TSyncApplyOutcome> {
    const result = await api.get(id);
    guard(gen);
    if (hooks.isStale()) return "skipped";
    if (!result.ok) {
      if (result.kind === "notFound" || result.kind === "failed") {
        dropRemoteOnly(gen, id);
        return "skipped";
      }
      hooks.onFailure(result);
      return "skipped";
    }
    const artwork = remoteFileToArtwork(result.value, id);
    if (!artwork) {
      deps.warn("Skipped unreadable Drive artwork", id);
      dropRemoteOnly(gen, id);
      return "skipped";
    }
    const local = await store.getStored(id);
    const open = (await presence.openIds()).has(id);
    guard(gen);
    if (hooks.isStale()) return "skipped";
    if (local && local.ownerId !== owner) return "skipped";
    const action = decidePull(local ? toFacts(local) : undefined, { id, updatedAt: artwork.updatedAt }, open);
    if (action === "defer") return "deferred";
    if (action !== "download") return "skipped";
    await store.putFromRemote(owner, { ...artwork, thumbnail: safeThumbnail(artwork) });
    tooLarge.delete(id);
    dropRemoteOnly(gen, id);
    emitRows(gen);
    return "written";
  }

  async function removeOne(
    owner: string,
    gen: number,
    id: string,
    plannedUpdatedAt: number,
  ): Promise<TSyncApplyOutcome> {
    const local = await store.getStored(id);
    const open = (await presence.openIds()).has(id);
    guard(gen);
    if (
      !local ||
      local.ownerId !== owner ||
      local.sync.state !== "synced" ||
      local.updatedAt !== plannedUpdatedAt
    ) {
      return "skipped";
    }
    if (open) return "deferred";
    await store.removeLocal(id);
    tooLarge.delete(id);
    emitRows(gen);
    return "written";
  }

  async function pushOne(
    owner: string,
    gen: number,
    id: string,
    deferredIds: Set<string>,
    hooks: ISyncPullHooks,
  ): Promise<void> {
    const row = await store.getStored(id);
    guard(gen);
    if (!row || row.ownerId !== owner || row.sync.state === "tooLarge") return;
    const previewPngBase64 =
      pngBase64FromDataUrl(row.thumbnail) ?? pngBase64FromDataUrl(safeThumbnail(row)) ?? "";
    const result = await api.save({ artwork: serializeArtworkFile(row), previewPngBase64 });
    guard(gen);
    if (result.ok) {
      await store.markSynced(id, result.value.updatedAt);
      tooLarge.delete(id);
      emitRows(gen);
    } else if (result.kind === "conflict") {
      if ((await pullOne(owner, gen, id, hooks)) === "deferred") deferredIds.add(id);
    } else if (result.kind === "tooLarge") {
      await store.markTooLarge(id);
      tooLarge.add(id);
      emitRows(gen);
    } else {
      fail(gen, result);
    }
  }

  function registerDeferred(gen: number, ids: Iterable<string>): void {
    for (const id of ids) {
      if (deferred.has(id)) continue;
      deferred.add(id);
      presence.waitForRelease(id).then(
        () => {
          if (gen !== generation) return;
          deferred.delete(id);
          void request("full");
        },
        () => {
          if (gen === generation) deferred.delete(id);
        },
      );
    }
  }

  async function runPass(kind: TSyncPassKind, owner: string, gen: number): Promise<void> {
    guard(gen);
    const hooks: ISyncPullHooks = { isStale: () => false, onFailure: (result) => fail(gen, result) };
    const deferredIds = new Set<string>();

    if (adoptPending) {
      await store.adoptUnowned(owner);
      adoptPending = false;
      // Also with nothing to adopt: the owner switch changes what the gallery shows.
      emitRows(gen);
    }
    if (!environment.isOnline()) {
      update(gen, { phase: "offline" });
      return;
    }
    update(gen, { phase: "syncing" });

    let remote: Map<string, IGalleryListItem> | null = null;
    if (kind === "full") {
      const listed = await api.list();
      guard(gen);
      if (!listed.ok) fail(gen, listed);
      remote = new Map(listed.value.map((item) => [item.id, item]));
    }

    for (const deletion of await store.listDeletions(owner)) {
      guard(gen);
      const result = await api.remove(deletion.id, deletion.deletedAt);
      guard(gen);
      if (result.ok) {
        await store.dropDeletion(deletion.id);
        remote?.delete(deletion.id);
      } else if (result.kind === "conflict") {
        // Edited on another device after the delete: the edit wins, so pull it back.
        await store.dropDeletion(deletion.id);
        if (!remote && (await pullOne(owner, gen, deletion.id, hooks)) === "deferred") {
          deferredIds.add(deletion.id);
        }
      } else {
        fail(gen, result);
      }
    }

    if (remote) {
      const locals = await store.listOwned(owner);
      const open = await presence.openIds();
      guard(gen);
      tooLarge.clear();
      for (const row of locals) if (row.sync.state === "tooLarge") tooLarge.add(row.id);
      const remoteItems = [...remote.values()];
      const plan = planSync(locals.map(toFacts), remoteItems, open);
      const localById = new Map(locals.map((row) => [row.id, row]));
      remoteOnly = remoteItems.filter((item) => !localById.has(item.id));
      update(gen, { remoteOnly });

      for (const id of plan.removals) {
        const outcome = await removeOne(owner, gen, id, localById.get(id)?.updatedAt ?? -1);
        if (outcome === "deferred") deferredIds.add(id);
      }
      for (const id of plan.downloads) {
        if ((await pullOne(owner, gen, id, hooks)) === "deferred") deferredIds.add(id);
      }
      for (const id of plan.uploads) await pushOne(owner, gen, id, deferredIds, hooks);
      for (const id of plan.deferred) deferredIds.add(id);
    } else {
      const dirty = await store.listDirty(owner);
      guard(gen);
      for (const row of dirty) tooLarge.delete(row.id);
      for (const id of planPush(dirty.map(toFacts), deferred)) {
        await pushOne(owner, gen, id, deferredIds, hooks);
      }
    }

    registerDeferred(gen, deferredIds);
    const pendingCount = await store.countUnsynced(owner);
    update(gen, {
      pendingCount,
      tooLargeIds: [...tooLarge],
      phase: "idle",
      lastSyncedAt: deps.now(),
    });
    if (kind === "full") {
      attempt = 0;
      cancelRetry();
    }
  }

  async function runGuarded(kind: TSyncPassKind, owner: string, gen: number): Promise<void> {
    try {
      await presence.runExclusive(() => runPass(kind, owner, gen));
    } catch (error) {
      if (error instanceof PassAbort || gen !== generation) return;
      deps.warn(String(error), owner);
      update(gen, { phase: "error" });
      scheduleRetry(gen, retryDelayMs(attempt++, null));
    }
  }

  async function drain(): Promise<void> {
    try {
      while (queued !== null && ownerId !== null) {
        const kind = queued;
        queued = null;
        const mine = waiters;
        waiters = [];
        const pass = runGuarded(kind, ownerId, generation);
        currentPass = pass;
        await pass;
        for (const resolve of mine) resolve();
      }
    } finally {
      loop = null;
      const rest = waiters;
      waiters = [];
      for (const resolve of rest) resolve();
    }
  }

  /** Resolves when the pass that serves this request ends; a request during a pass queues one follow-up. */
  function request(kind: TSyncPassKind): Promise<void> {
    if (ownerId === null) return Promise.resolve();
    return new Promise<void>((resolve) => {
      queued = queued === "full" || kind === "full" ? "full" : "push";
      waiters.push(resolve);
      loop ??= drain();
    });
  }

  async function stop(): Promise<void> {
    generation += 1;
    ownerId = null;
    adoptPending = false;
    attempt = 0;
    phase = "disabled";
    remoteOnly = [];
    queued = null;
    deferred.clear();
    tooLarge.clear();
    cancelDebounce();
    cancelRetry();
    for (const unsubscribe of unsubscribers) unsubscribe();
    unsubscribers = [];
    const released = waiters;
    waiters = [];
    for (const resolve of released) resolve();
    deps.setStatus(INITIAL_SYNC_STATUS);
    await currentPass;
  }

  async function start(owner: string): Promise<void> {
    if (ownerId === owner) return;
    if (ownerId !== null) await stop();
    ownerId = owner;
    adoptPending = true;
    attempt = 0;
    unsubscribers = [
      deps.onArtworkChanged(() => {
        if (phase === "reauth") return;
        cancelDebounce();
        debounceCancel = timers.after(PUSH_DEBOUNCE_MS, () => {
          debounceCancel = null;
          void request("push");
        });
      }),
      environment.onOnline(() => {
        attempt = 0;
        cancelRetry();
        void request("full");
      }),
      environment.onHidden(() => {
        if (phase !== "reauth") void request("push");
      }),
    ];
    await request("full");
  }

  async function flush(timeoutMs: number): Promise<void> {
    if (ownerId === null) return;
    let cancel = () => {};
    const timeout = new Promise<void>((resolve) => {
      cancel = timers.after(timeoutMs, resolve);
    });
    try {
      await Promise.race([request("push"), timeout]);
    } finally {
      cancel();
    }
  }

  async function refreshWork(owner: string, gen: number, id: string, isStale: () => boolean): Promise<void> {
    const onFailure = (result: TSyncApiFailure) => {
      if (result.kind === "reauth" || result.kind === "unauthenticated") {
        cancelRetry();
        update(gen, { phase: "reauth" });
      }
    };
    const listed = await api.list();
    guard(gen);
    if (isStale()) return;
    if (!listed.ok) return onFailure(listed);
    const remote = listed.value.find((item) => item.id === id);
    const local = await store.getStored(id);
    const open = (await presence.openIds()).has(id);
    guard(gen);
    if (isStale() || (local && local.ownerId !== owner)) return;
    if (decidePull(local ? toFacts(local) : undefined, remote, open) !== "download") return;
    await pullOne(owner, gen, id, { isStale, onFailure });
  }

  async function refreshOne(id: string, timeoutMs: number): Promise<void> {
    const owner = ownerId;
    if (owner === null || !environment.isOnline()) return;
    const gen = generation;
    let abandoned = false;
    let cancel = () => {};
    const timeout = new Promise<void>((resolve) => {
      cancel = timers.after(timeoutMs, () => {
        abandoned = true;
        resolve();
      });
    });
    const work = refreshWork(owner, gen, id, () => abandoned || gen !== generation).catch(() => {});
    try {
      await Promise.race([work, timeout]);
    } finally {
      cancel();
    }
  }

  return {
    start,
    stop,
    syncNow: () => request("full"),
    flush,
    refreshOne,
    onLocalRowsChanged(listener) {
      rowListeners.add(listener);
      return () => {
        rowListeners.delete(listener);
      };
    },
  };
}
