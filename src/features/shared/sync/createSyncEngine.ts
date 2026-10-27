/**
 * Purpose:
 * The Drive sync engine: pulls newer Drive copies, pushes local edits and deletions, and keeps the
 * sync status current. Built only from injected dependencies so it runs in Node tests.
 *
 * Notes:
 * - The most recent `updatedAt` wins, a tie goes to Drive (`decidePull`).
 * - Passes are single-flight per tab and run inside `presence.runExclusive` (one pass across tabs).
 * - Every store write and status update is preceded by a generation check, so after `stop()` nothing
 *   lands, and `stop()` waits for the writes already in flight. Writes over an existing row go
 *   through conditional store calls (same `updatedAt`, state and owner as when it was decided) and
 *   re-check presence right before, so an edit or an editor that appeared mid-download wins.
 * - Offline, reauth and Drive errors abort the pass and never delete or overwrite anything. A push
 *   that fails for one row alone is skipped, so one poisoned row cannot starve the others.
 * - `stop()` aborts a pass still waiting for the cross-tab lock and waits only for work that is
 *   running; every request has a timeout, so a stalled one cannot hold it forever.
 */
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import { serializeArtworkFile } from "@/features/shared/artwork/artworkFileFormat";
import type { IStoredArtwork } from "@/features/shared/artwork/artworkSync.type";
import { isThumbnailCurrent } from "@/features/shared/artwork/thumbnailFreshness";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";
import type { IGalleryApiClient, TApiResult } from "@/features/shared/drive/galleryApiClient.type";
import { pngBase64FromDataUrl, remoteFileToArtwork } from "./logic/remoteArtwork";
import { decidePull, planPush, planSync, retryDelayMs } from "./logic/syncRules";
import type { ILocalSyncFacts } from "./logic/syncRules.type";
import type {
  ISyncEngine,
  ISyncEngineDeps,
  ISyncPassContext,
  ISyncPullHooks,
  ISyncStatus,
  TSyncApiFailure,
  TSyncApplyOutcome,
  TSyncPassKind,
  TSyncPhase,
} from "./sync.type";

export const PUSH_DEBOUNCE_MS = 10_000;
/** A request that has not answered by then counts as a failure to retry; it cannot hold a pass or `stop()`. */
export const REQUEST_TIMEOUT_MS = 30_000;

export const INITIAL_SYNC_STATUS: ISyncStatus = {
  phase: "disabled",
  pendingCount: 0,
  remoteOnly: [],
  tooLargeIds: [],
  lastSyncedAt: null,
};

/** Thrown to unwind a pass that was stopped or already reported its failure. */
class PassAbort extends Error {}

const noop = () => {};

const toFacts = (row: IStoredArtwork): ILocalSyncFacts => ({
  id: row.id,
  updatedAt: row.updatedAt,
  state: row.sync.state,
});

const expectedOf = (row: IStoredArtwork) => ({
  ownerId: row.ownerId,
  updatedAt: row.updatedAt,
  state: row.sync.state,
});

export function createSyncEngine(deps: ISyncEngineDeps): ISyncEngine {
  const { store, presence, environment, timers } = deps;

  function withTimeout<T>(call: Promise<TApiResult<T>>): Promise<TApiResult<T>> {
    let cancel = noop;
    const timeout = new Promise<TApiResult<T>>((resolve) => {
      cancel = timers.after(REQUEST_TIMEOUT_MS, () =>
        resolve({ ok: false, kind: "retry", retryAfterMs: 0 }),
      );
    });
    return Promise.race([call, timeout]).finally(cancel);
  }

  const api: IGalleryApiClient = {
    list: () => withTimeout(deps.api.list()),
    get: (id) => withTimeout(deps.api.get(id)),
    save: (request) => withTimeout(deps.api.save(request)),
    remove: (id, deletedAt) => withTimeout(deps.api.remove(id, deletedAt)),
  };

  let ownerId: string | null = null;
  let generation = 0;
  let controller = new AbortController();
  let attempt = 0;
  let phase: TSyncPhase = "disabled";
  let remoteOnly: IGalleryListItem[] = [];
  let adoption: Promise<void> | null = null;
  let queued: TSyncPassKind | null = null;
  let waiters: Array<() => void> = [];
  let serving: Array<() => void> = [];
  let loop: Promise<void> | null = null;
  let debounceCancel: (() => void) | null = null;
  let retryCancel: (() => void) | null = null;
  let unsubscribers: Array<() => void> = [];
  /** Work that may write to the store; `stop()` waits for it, never for a pass still queued for the lock. */
  const running = new Set<Promise<void>>();
  const deferred = new Set<string>();
  const tooLarge = new Set<string>();
  const rowListeners = new Set<() => void>();

  function track(work: Promise<unknown>): void {
    const settled = work.then(noop, noop);
    running.add(settled);
    void settled.then(() => running.delete(settled));
  }

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

  /** Publishes the unsynced count and too-large ids; never throws, so every exit path can call it. */
  async function publishPending(owner: string, gen: number): Promise<void> {
    if (gen !== generation) return;
    try {
      const pendingCount = await store.countUnsynced(owner);
      update(gen, { pendingCount, tooLargeIds: [...tooLarge] });
    } catch {
      // A failed count leaves the previous one; the next pass publishes again.
    }
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

  /** A real PNG for Drive: the stored thumbnail when current, else a fresh render, else a stale PNG; null when none. */
  function previewFor(row: IStoredArtwork): string | null {
    const stored = pngBase64FromDataUrl(row.thumbnail);
    if (stored && isThumbnailCurrent(row.thumbnail, row.width, row.height)) return stored;
    return pngBase64FromDataUrl(safeThumbnail(row)) ?? stored;
  }

  /**
   * Fetches one Drive copy and applies it. The decision is re-made on the freshest local row and
   * presence right before the write, and the write itself is conditional on that row: a GET can
   * take seconds, during which the user may have edited the row or an editor may have opened it.
   */
  async function pullOne(ctx: ISyncPassContext, id: string): Promise<TSyncApplyOutcome> {
    const { owner, gen, hooks } = ctx;
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
    const open = (await presence.openIds()).has(id);
    const local = await store.getStored(id);
    guard(gen);
    if (hooks.isStale()) return "skipped";
    if (local && local.ownerId !== owner) return "skipped";
    const action = decidePull(local ? toFacts(local) : undefined, { id, updatedAt: artwork.updatedAt }, open);
    if (action === "defer") return "deferred";
    if (action !== "download") return "skipped";
    const thumbnail = safeThumbnail(artwork);
    const written = await store.putFromRemote(owner, { ...artwork, thumbnail }, local ? expectedOf(local) : undefined);
    if (!written) return "skipped";
    tooLarge.delete(id);
    dropRemoteOnly(gen, id);
    emitRows(gen);
    return "written";
  }

  async function removeOne(ctx: ISyncPassContext, id: string, plannedUpdatedAt: number): Promise<TSyncApplyOutcome> {
    const { owner, gen } = ctx;
    const open = (await presence.openIds()).has(id);
    const local = await store.getStored(id);
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
    if (!(await store.removeLocal(id, expectedOf(local)))) return "skipped";
    tooLarge.delete(id);
    emitRows(gen);
    return "written";
  }

  async function pushOne(ctx: ISyncPassContext, id: string): Promise<void> {
    const { owner, gen } = ctx;
    const row = await store.getStored(id);
    guard(gen);
    if (!row || row.ownerId !== owner || row.sync.state === "tooLarge") return;
    const previewPngBase64 = previewFor(row);
    if (previewPngBase64 === null) {
      deps.warn("No preview could be made for artwork", id);
      ctx.failedIds.add(id);
      return;
    }
    const result = await api.save({ artwork: serializeArtworkFile(row), previewPngBase64 });
    guard(gen);
    if (result.ok) {
      await store.markSynced(id, result.value.updatedAt);
      tooLarge.delete(id);
      emitRows(gen);
    } else if (result.kind === "conflict") {
      if ((await pullOne(ctx, id)) === "deferred") ctx.deferredIds.add(id);
    } else if (result.kind === "tooLarge") {
      if (await store.markTooLarge(id, row.updatedAt)) tooLarge.add(id);
      emitRows(gen);
    } else if (result.kind === "failed") {
      deps.warn("Drive rejected artwork", id);
      ctx.failedIds.add(id);
    } else {
      fail(gen, result);
    }
  }

  function registerDeferred(ctx: ISyncPassContext): void {
    const { gen, signal } = ctx;
    for (const id of ctx.deferredIds) {
      if (deferred.has(id)) continue;
      deferred.add(id);
      presence.waitForRelease(id, signal).then(
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

  /** Adopts signed-out rows for the new owner and tells the gallery; per generation, retried after a failure. */
  function adopt(owner: string, gen: number): Promise<void> {
    const work = (async () => {
      await store.adoptUnowned(owner);
      // Also with nothing to adopt: the owner switch changes what the gallery shows.
      emitRows(gen);
    })();
    adoption = work;
    track(work);
    work.catch(() => {
      if (adoption === work) adoption = null;
    });
    return work;
  }

  /** Returns false when it ended without publishing the final status itself. */
  async function passBody(kind: TSyncPassKind, ctx: ISyncPassContext): Promise<boolean> {
    const { owner, gen } = ctx;
    guard(gen);
    await (adoption ?? adopt(owner, gen));
    guard(gen);
    if (!environment.isOnline()) {
      update(gen, { phase: "offline" });
      return false;
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
        if (!remote && (await pullOne(ctx, deletion.id)) === "deferred") ctx.deferredIds.add(deletion.id);
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
        if ((await removeOne(ctx, id, localById.get(id)?.updatedAt ?? -1)) === "deferred") ctx.deferredIds.add(id);
      }
      for (const id of plan.downloads) {
        if ((await pullOne(ctx, id)) === "deferred") ctx.deferredIds.add(id);
      }
      for (const id of plan.uploads) await pushOne(ctx, id);
      for (const id of plan.deferred) ctx.deferredIds.add(id);
    } else {
      const dirty = await store.listDirty(owner);
      guard(gen);
      for (const row of dirty) tooLarge.delete(row.id);
      for (const id of planPush(dirty.map(toFacts), deferred)) await pushOne(ctx, id);
    }

    registerDeferred(ctx);
    const pendingCount = await store.countUnsynced(owner);
    if (ctx.failedIds.size > 0) {
      update(gen, { pendingCount, tooLargeIds: [...tooLarge], phase: "error" });
      scheduleRetry(gen, retryDelayMs(attempt++, null));
      return true;
    }
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
    return true;
  }

  async function runPass(kind: TSyncPassKind, owner: string, gen: number, signal: AbortSignal): Promise<void> {
    const ctx: ISyncPassContext = {
      owner,
      gen,
      signal,
      deferredIds: new Set(),
      failedIds: new Set(),
      hooks: { isStale: () => false, onFailure: (result) => fail(gen, result) },
    };
    let published = false;
    try {
      published = await passBody(kind, ctx);
    } finally {
      // Offline, error and reauth exits leave the count current too.
      if (!published) await publishPending(owner, gen);
    }
  }

  async function runGuarded(kind: TSyncPassKind, owner: string, gen: number): Promise<void> {
    const signal = controller.signal;
    try {
      await presence.runExclusive(() => {
        const pass = runPass(kind, owner, gen, signal);
        track(pass);
        return pass;
      }, signal);
    } catch (error) {
      if (error instanceof PassAbort || gen !== generation) return;
      deps.warn(String(error), owner);
      update(gen, { phase: "error" });
      scheduleRetry(gen, retryDelayMs(attempt++, null));
    }
  }

  async function drain(gen: number): Promise<void> {
    while (queued !== null && gen === generation && ownerId !== null) {
      const kind = queued;
      queued = null;
      const mine = waiters;
      waiters = [];
      serving = mine;
      await runGuarded(kind, ownerId, gen);
      for (const resolve of mine) resolve();
      serving = [];
    }
    if (gen === generation) loop = null;
  }

  /** Resolves when the pass that serves this request ends; a request during a pass queues one follow-up. */
  function request(kind: TSyncPassKind): Promise<void> {
    if (ownerId === null) return Promise.resolve();
    return new Promise<void>((resolve) => {
      queued = queued === "full" || kind === "full" ? "full" : "push";
      waiters.push(resolve);
      loop ??= drain(generation);
    });
  }

  async function stop(): Promise<void> {
    generation += 1;
    ownerId = null;
    adoption = null;
    attempt = 0;
    phase = "disabled";
    remoteOnly = [];
    queued = null;
    loop = null;
    deferred.clear();
    tooLarge.clear();
    cancelDebounce();
    cancelRetry();
    for (const unsubscribe of unsubscribers) unsubscribe();
    unsubscribers = [];
    controller.abort();
    controller = new AbortController();
    // Requests whose pass will never finish (stuck behind the lock) must not leave callers hanging.
    const released = [...serving, ...waiters];
    serving = [];
    waiters = [];
    for (const resolve of released) resolve();
    deps.setStatus(INITIAL_SYNC_STATUS);
    await Promise.all([...running]);
  }

  async function start(owner: string): Promise<void> {
    if (ownerId === owner) return;
    if (ownerId !== null) await stop();
    if (ownerId !== null) return;
    ownerId = owner;
    attempt = 0;
    const gen = generation;
    unsubscribers = [
      deps.onArtworkChanged(() => {
        void publishPending(owner, gen);
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
    void adopt(owner, gen).catch(noop);
    await request("full");
  }

  async function flush(timeoutMs: number): Promise<void> {
    if (ownerId === null) return;
    let cancel = noop;
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
    const open = (await presence.openIds()).has(id);
    const local = await store.getStored(id);
    guard(gen);
    if (isStale() || (local && local.ownerId !== owner)) return;
    if (decidePull(local ? toFacts(local) : undefined, remote, open) !== "download") return;
    await pullOne(
      {
        owner,
        gen,
        signal: controller.signal,
        deferredIds: new Set(),
        failedIds: new Set(),
        hooks: { isStale, onFailure } satisfies ISyncPullHooks,
      },
      id,
    );
  }

  async function refreshOne(id: string, timeoutMs: number): Promise<void> {
    const owner = ownerId;
    if (owner === null || !environment.isOnline()) return;
    const gen = generation;
    let abandoned = false;
    let cancel = noop;
    const timeout = new Promise<void>((resolve) => {
      cancel = timers.after(timeoutMs, () => {
        abandoned = true;
        resolve();
      });
    });
    const work = refreshWork(owner, gen, id, () => abandoned || gen !== generation).catch(noop);
    track(work);
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
