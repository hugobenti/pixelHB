import { describe, expect, it, vi } from "vitest";

import { serializeArtworkFile } from "@/features/shared/artwork/artworkFileFormat";
import type { IArtworkFileV3 } from "@/features/shared/artwork/artworkFileService.type";
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import type { IArtworkDeletion, IStoredArtwork, ISyncExpectedRow, TArtworkSyncState } from "@/features/shared/artwork/artworkSync.type";
import type { IGalleryListItem } from "@/features/shared/drive/galleryApi.type";
import type { IGalleryApiClient, TApiResult } from "@/features/shared/drive/galleryApiClient.type";
import { createSyncEngine, INITIAL_SYNC_STATUS } from "./createSyncEngine";
import type { ISyncLocalStore, ISyncStatus } from "./sync.type";

const OWNER = "google-sub-1";
const PNG = "data:image/png;base64,iVBORw0KGgo=";

function row(id: string, updatedAt: number, state: TArtworkSyncState, ownerId: string | null = OWNER): IStoredArtwork {
  return {
    id, title: id, width: 1, height: 1, createdAt: 1, updatedAt, thumbnail: PNG, palette: ["#000000"], activeLayerId: "l",
    layers: [{ id: "l", name: "Layer 1", visible: true, pixelData: new Uint8Array([0]) }],
    ownerId, sync: { state, syncedUpdatedAt: state === "synced" ? updatedAt : null },
  };
}

function setup(seed: { local?: IStoredArtwork[]; remote?: IStoredArtwork[]; deletions?: IArtworkDeletion[] } = {}) {
  const rows = new Map((seed.local ?? []).map((r) => [r.id, r]));
  const deletions = new Map((seed.deletions ?? []).map((d) => [d.id, d]));
  const drive = new Map<string, IArtworkFileV3>((seed.remote ?? []).map((r) => [r.id, serializeArtworkFile(r)]));
  const ownedBy = (ownerId: string) => [...rows.values()].filter((r) => r.ownerId === ownerId);
  const matches = (row: IStoredArtwork | undefined, e: ISyncExpectedRow | undefined) =>
    row ? !!e && row.ownerId === e.ownerId && row.updatedAt === e.updatedAt && row.sync.state === e.state : e === undefined;
  const store = {
    getStored: vi.fn(async (id: string) => { const r = rows.get(id); return r && structuredClone(r); }),
    listOwned: async (ownerId) => ownedBy(ownerId),
    listDirty: async (ownerId) => ownedBy(ownerId).filter((r) => r.sync.state === "dirty").sort((a, b) => a.updatedAt - b.updatedAt),
    markSynced: vi.fn(async (id: string, at: number) => { const r = rows.get(id)!; r.sync = { state: r.updatedAt === at ? "synced" : "dirty", syncedUpdatedAt: at }; }),
    markTooLarge: vi.fn(async (id: string, pushedUpdatedAt: number) => {
      const r = rows.get(id);
      if (!r || r.updatedAt !== pushedUpdatedAt) return false;
      r.sync.state = "tooLarge";
      return true;
    }),
    putFromRemote: vi.fn(async (ownerId: string, artwork: IArtwork, expected: ISyncExpectedRow | undefined) => {
      if (!matches(rows.get(artwork.id), expected)) return false;
      rows.set(artwork.id, { ...artwork, ownerId, sync: { state: "synced", syncedUpdatedAt: artwork.updatedAt } });
      return true;
    }),
    removeLocal: vi.fn(async (id: string, expected: ISyncExpectedRow) => {
      if (!rows.has(id) || !matches(rows.get(id), expected)) return false;
      rows.delete(id);
      return true;
    }),
    listDeletions: async (ownerId) => [...deletions.values()].filter((d) => d.ownerId === ownerId),
    dropDeletion: vi.fn(async (id: string) => { deletions.delete(id); }),
    adoptUnowned: vi.fn(async (ownerId: string) => {
      let count = 0;
      for (const r of rows.values()) if (r.ownerId === null) { r.ownerId = ownerId; r.sync = { state: "dirty", syncedUpdatedAt: null }; count += 1; }
      return count;
    }),
    countUnsynced: async (ownerId) => ownedBy(ownerId).filter((r) => r.sync.state !== "synced").length + [...deletions.values()].filter((d) => d.ownerId === ownerId).length,
  } satisfies ISyncLocalStore;
  const item = (f: IArtworkFileV3): IGalleryListItem => ({
    id: f.id, title: f.title, width: f.width, height: f.height, createdAt: f.createdAt, updatedAt: f.updatedAt,
    previewUrl: `/api/gallery/${f.id}/preview?v=${f.updatedAt}`,
  });
  const api = {
    list: vi.fn<IGalleryApiClient["list"]>(async () => ({ ok: true, value: [...drive.values()].map(item) })),
    get: vi.fn<IGalleryApiClient["get"]>(async (id) => { const f = drive.get(id); return f ? { ok: true, value: f } : { ok: false, kind: "notFound" }; }),
    save: vi.fn<IGalleryApiClient["save"]>(async ({ artwork }) => {
      const current = drive.get(artwork.id);
      if (current && current.updatedAt > artwork.updatedAt) return { ok: false, kind: "conflict", updatedAt: current.updatedAt };
      drive.set(artwork.id, artwork);
      return { ok: true, value: { updatedAt: artwork.updatedAt } };
    }),
    remove: vi.fn<IGalleryApiClient["remove"]>(async (id, deletedAt) => {
      const current = drive.get(id);
      if (current && current.updatedAt > deletedAt) return { ok: false, kind: "conflict", updatedAt: current.updatedAt };
      drive.delete(id);
      return { ok: true, value: null };
    }),
  };
  let now = 1_000;
  let online = true;
  let status: ISyncStatus = INITIAL_SYNC_STATUS;
  const timers: { at: number; run: () => void; live: boolean }[] = [];
  const open = new Set<string>();
  const releaseWaiters = new Map<string, () => void>();
  const onOnline = new Set<() => void>();
  const onHidden = new Set<() => void>();
  const onChange = new Set<(id: string) => void>();
  const warn = vi.fn();
  let lockBlocked = false;
  let rendered = PNG;
  const engine = createSyncEngine({
    api, store, warn, now: () => now, renderThumbnail: () => rendered,
    presence: {
      openIds: async () => new Set(open),
      waitForRelease: (id) => new Promise<void>((resolve) => releaseWaiters.set(id, resolve)),
      runExclusive: (task) => (lockBlocked ? new Promise<never>(() => {}) : task()),
    },
    environment: {
      isOnline: () => online,
      onOnline: (l) => { onOnline.add(l); return () => onOnline.delete(l); },
      onHidden: (l) => { onHidden.add(l); return () => onHidden.delete(l); },
    },
    timers: { after: (ms, run) => { const t = { at: now + ms, run, live: true }; timers.push(t); return () => { t.live = false; }; } },
    setStatus: (patch) => { status = { ...status, ...patch }; },
    onArtworkChanged: (l) => { onChange.add(l); return () => onChange.delete(l); },
  });
  return {
    engine, api, store, rows, drive, deletions, open, warn,
    status: () => status,
    blockLock: () => { lockBlocked = true; },
    setRender: (value: string) => { rendered = value; },
    setOnline: (value: boolean) => { online = value; },
    advance: (ms: number) => { now += ms; for (const t of timers.filter((t) => t.live && t.at <= now)) { t.live = false; t.run(); } },
    pendingDelays: () => timers.filter((t) => t.live).map((t) => t.at - now),
    emitOnline: () => onOnline.forEach((l) => l()),
    emitHidden: () => onHidden.forEach((l) => l()),
    emitChange: (id: string) => onChange.forEach((l) => l(id)),
    release: (id: string) => { open.delete(id); releaseWaiters.get(id)?.(); },
    edit: (id: string, updatedAt: number) => { const r = rows.get(id)!; r.updatedAt = updatedAt; r.sync.state = "dirty"; },
  };
}
const pending = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>((r) => { resolve = r; }); return { promise, resolve }; };

describe("sync engine", () => {
  it("adopts signed-out drawings on first sign-in and uploads them", async () => {
    const h = setup({ local: [row("a", 100, "local", null)] });
    await h.engine.start(OWNER);
    expect(h.store.adoptUnowned).toHaveBeenCalledWith(OWNER);
    expect(h.drive.get("a")?.updatedAt).toBe(100);
    expect(h.rows.get("a")?.sync).toEqual({ state: "synced", syncedUpdatedAt: 100 });
    expect(h.status()).toMatchObject({ phase: "idle", pendingCount: 0, lastSyncedAt: 1_000 });
  });

  it("downloads Drive-only art newest first and removes rows deleted on another device", async () => {
    const h = setup({ local: [row("gone", 50, "synced")], remote: [row("b", 200, "synced"), row("c", 300, "synced")] });
    const changed = vi.fn();
    h.engine.onLocalRowsChanged(changed);
    await h.engine.start(OWNER);
    expect(h.api.get.mock.calls.map(([id]) => id)).toEqual(["c", "b"]);
    expect([...h.rows.keys()].sort()).toEqual(["b", "c"]);
    expect(h.status().remoteOnly).toEqual([]);
    expect(changed).toHaveBeenCalled();
  });

  it("pulls the Drive copy when a push is rejected as older (409)", async () => {
    const h = setup({ local: [row("a", 100, "dirty")], remote: [row("a", 500, "synced")] });
    h.api.list.mockResolvedValueOnce({ ok: true, value: [] }); // listed just before another device saved
    await h.engine.start(OWNER);
    expect(h.api.save).toHaveBeenCalledTimes(1);
    expect(h.rows.get("a")).toMatchObject({ updatedAt: 500, sync: { state: "synced", syncedUpdatedAt: 500 } });
  });

  it("keeps work dirty while offline and retries with growing backoff until online", async () => {
    const h = setup({ local: [row("a", 100, "dirty")] });
    h.api.list.mockResolvedValueOnce({ ok: false, kind: "offline" }).mockResolvedValueOnce({ ok: false, kind: "offline" });
    await h.engine.start(OWNER);
    expect(h.status().phase).toBe("offline");
    expect(h.rows.get("a")?.sync.state).toBe("dirty");
    expect(h.pendingDelays()).toEqual([1_000]);
    h.advance(1_000);
    await vi.waitFor(() => expect(h.pendingDelays()).toEqual([2_000]));
    h.emitOnline();
    await vi.waitFor(() => expect(h.rows.get("a")?.sync.state).toBe("synced"));
    expect(h.pendingDelays()).toEqual([]);
  });

  it("pauses on reauth without deleting or overwriting anything", async () => {
    const h = setup({ local: [row("a", 100, "synced"), row("b", 200, "dirty")] });
    h.api.list.mockResolvedValue({ ok: false, kind: "reauth" });
    await h.engine.start(OWNER);
    expect(h.status().phase).toBe("reauth");
    expect(h.store.removeLocal).not.toHaveBeenCalled();
    expect(h.store.putFromRemote).not.toHaveBeenCalled();
    expect([...h.rows.keys()]).toEqual(["a", "b"]);
    expect(h.pendingDelays()).toEqual([]);
    h.emitChange("b");
    h.advance(10_000);
    expect(h.api.save).not.toHaveBeenCalled();
  });

  it("marks an artwork too large once and never retries it", async () => {
    const h = setup({ local: [row("big", 100, "dirty")] });
    h.api.save.mockResolvedValueOnce({ ok: false, kind: "tooLarge" });
    await h.engine.start(OWNER);
    await h.engine.syncNow();
    expect(h.api.save).toHaveBeenCalledTimes(1);
    expect(h.rows.get("big")?.sync.state).toBe("tooLarge");
    expect(h.status()).toMatchObject({ phase: "idle", tooLargeIds: ["big"], pendingCount: 1 });
    expect(h.pendingDelays()).toEqual([]);
  });

  it("trashes a deleted artwork in Drive (204) and does not download it back", async () => {
    const h = setup({ remote: [row("x", 200, "synced")], deletions: [{ id: "x", ownerId: OWNER, deletedAt: 300 }] });
    await h.engine.start(OWNER);
    expect(h.api.remove).toHaveBeenCalledWith("x", 300);
    expect(h.deletions.size).toBe(0);
    expect(h.api.get).not.toHaveBeenCalled();
    expect(h.rows.has("x")).toBe(false);
  });

  it("lets a newer edit from another device win over an older delete (409)", async () => {
    const h = setup({ remote: [row("x", 400, "synced")], deletions: [{ id: "x", ownerId: OWNER, deletedAt: 300 }] });
    await h.engine.start(OWNER);
    expect(h.deletions.size).toBe(0);
    expect(h.rows.get("x")).toMatchObject({ updatedAt: 400, sync: { state: "synced" } });
  });

  it("never overwrites an artwork open in an editor and applies the pull once it closes", async () => {
    const h = setup({ local: [row("a", 100, "synced")], remote: [row("a", 200, "synced")] });
    h.open.add("a");
    await h.engine.start(OWNER);
    expect(h.store.putFromRemote).not.toHaveBeenCalled();
    h.release("a");
    await vi.waitFor(() => expect(h.rows.get("a")?.updatedAt).toBe(200));
  });

  it("re-checks presence right before writing a download", async () => {
    const h = setup({ local: [row("a", 100, "synced")], remote: [row("a", 200, "synced")] });
    const get = h.api.get.getMockImplementation()!;
    h.api.get.mockImplementationOnce(async (id) => { h.open.add(id); return get(id); });
    await h.engine.start(OWNER);
    expect(h.rows.get("a")?.updatedAt).toBe(100);
  });

  it("skips a Drive file that is not a valid artwork and syncs the rest", async () => {
    const h = setup({ remote: [row("bad", 300, "synced"), row("good", 200, "synced")] });
    h.drive.set("bad", { ...h.drive.get("bad")!, layers: "oops" } as unknown as IArtworkFileV3);
    await h.engine.start(OWNER);
    expect(h.rows.has("bad")).toBe(false);
    expect(h.rows.get("good")?.updatedAt).toBe(200);
    expect(h.warn).toHaveBeenCalledWith(expect.any(String), "bad");
    expect(h.status()).toMatchObject({ phase: "idle", remoteOnly: [] });
  });

  it("pushes 10 s after the last local change, without re-listing", async () => {
    const h = setup({ local: [row("a", 100, "synced")], remote: [row("a", 100, "synced")] });
    await h.engine.start(OWNER);
    h.edit("a", 150);
    h.emitChange("a");
    h.advance(5_000);
    h.emitChange("a");
    h.advance(9_999);
    expect(h.api.save).not.toHaveBeenCalled();
    h.advance(1);
    await vi.waitFor(() => expect(h.rows.get("a")?.sync.state).toBe("synced"));
    expect(h.api.save).toHaveBeenCalledTimes(1);
    expect(h.api.list).toHaveBeenCalledTimes(1);
  });

  it("syncs when the browser comes online and pushes when the tab is hidden", async () => {
    const h = setup({ local: [row("a", 100, "dirty")] });
    h.setOnline(false);
    await h.engine.start(OWNER);
    expect(h.status().phase).toBe("offline");
    expect(h.api.list).not.toHaveBeenCalled();
    h.setOnline(true);
    h.emitOnline();
    await vi.waitFor(() => expect(h.rows.get("a")?.sync.state).toBe("synced"));
    h.edit("a", 150);
    h.emitHidden();
    await vi.waitFor(() => expect(h.drive.get("a")?.updatedAt).toBe(150));
    expect(h.api.list).toHaveBeenCalledTimes(1);
  });

  it("flush resolves after its timeout while a push is still in flight", async () => {
    const h = setup({ local: [row("a", 100, "dirty")] });
    h.api.save.mockImplementationOnce(() => new Promise(() => {}));
    void h.engine.start(OWNER);
    await vi.waitFor(() => expect(h.api.save).toHaveBeenCalled());
    const flushed = h.engine.flush(10_000);
    h.advance(10_000);
    await expect(flushed).resolves.toBeUndefined();
  });

  it("stop waits for the in-flight pass and nothing is written after it", async () => {
    const h = setup({ remote: [row("a", 100, "synced")] });
    const download = pending<TApiResult<IArtworkFileV3>>();
    h.api.get.mockImplementationOnce(() => download.promise);
    const started = h.engine.start(OWNER);
    await vi.waitFor(() => expect(h.api.get).toHaveBeenCalled());
    const stopped = h.engine.stop();
    download.resolve({ ok: true, value: h.drive.get("a")! });
    await Promise.all([stopped, started]);
    expect(h.rows.has("a")).toBe(false);
    expect(h.status()).toEqual(INITIAL_SYNC_STATUS);
  });

  describe("refreshOne", () => {
    it("downloads only when Drive is newer than the local copy", async () => {
      const h = setup({ local: [row("same", 100, "synced"), row("old", 100, "synced")], remote: [row("same", 100, "synced"), row("old", 100, "synced")] });
      await h.engine.start(OWNER);
      h.drive.set("old", serializeArtworkFile(row("old", 900, "synced")));
      h.api.get.mockClear();
      await h.engine.refreshOne("same", 3_000);
      expect(h.api.get).not.toHaveBeenCalled();
      await h.engine.refreshOne("old", 3_000);
      expect(h.rows.get("old")?.updatedAt).toBe(900);
    });

    it("gives up after the timeout and never applies a late download", async () => {
      const h = setup({ local: [row("a", 100, "synced")], remote: [row("a", 100, "synced")] });
      await h.engine.start(OWNER);
      h.drive.set("a", serializeArtworkFile(row("a", 900, "synced")));
      const download = pending<TApiResult<IArtworkFileV3>>();
      h.api.get.mockImplementationOnce(() => download.promise);
      const refresh = h.engine.refreshOne("a", 3_000);
      await vi.waitFor(() => expect(h.api.get).toHaveBeenCalledWith("a"));
      h.advance(3_000);
      await refresh;
      download.resolve({ ok: true, value: h.drive.get("a")! });
      await new Promise((resolve) => setImmediate(resolve));
      expect(h.rows.get("a")?.updatedAt).toBe(100);
    });
  });
  describe("conditional writes", () => {
    it("does not overwrite a row edited between the read and the write of a download", async () => {
      const h = setup({ local: [row("a", 100, "synced")], remote: [row("a", 200, "synced")] });
      h.store.getStored.mockImplementationOnce(async (id) => {
        const seen = structuredClone(h.rows.get(id));
        h.edit(id, 150);
        return seen;
      });
      await h.engine.start(OWNER);
      expect(h.store.putFromRemote).toHaveBeenCalledTimes(1);
      expect(h.rows.get("a")).toMatchObject({ updatedAt: 150, sync: { state: "dirty" } });
    });

    it("does not delete a row edited between the read and the removal", async () => {
      const h = setup({ local: [row("gone", 50, "synced")] });
      h.store.getStored.mockImplementationOnce(async (id) => {
        const seen = structuredClone(h.rows.get(id));
        h.edit(id, 60);
        return seen;
      });
      await h.engine.start(OWNER);
      expect(h.store.removeLocal).toHaveBeenCalledTimes(1);
      expect(h.rows.get("gone")).toMatchObject({ updatedAt: 60, sync: { state: "dirty" } });
    });

    it("keeps a row dirty when it was edited while the too-large upload was rejected", async () => {
      const h = setup({ local: [row("big", 100, "dirty")] });
      h.api.save.mockImplementationOnce(async () => { h.edit("big", 150); return { ok: false, kind: "tooLarge" }; });
      await h.engine.start(OWNER);
      expect(h.rows.get("big")?.sync.state).toBe("dirty");
      expect(h.status().tooLargeIds).toEqual([]);
    });
  });

  describe("decisions end to end", () => {
    it("lets a tied Drive copy replace a too-large row", async () => {
      const h = setup({ local: [row("t", 100, "tooLarge")], remote: [row("t", 100, "synced")] });
      await h.engine.start(OWNER);
      expect(h.rows.get("t")?.sync.state).toBe("synced");
      expect(h.status().tooLargeIds).toEqual([]);
    });

    it("defers removing an open synced row until its editor closes", async () => {
      const h = setup({ local: [row("gone", 50, "synced")] });
      h.open.add("gone");
      await h.engine.start(OWNER);
      expect(h.store.removeLocal).not.toHaveBeenCalled();
      expect(h.rows.has("gone")).toBe(true);
      h.release("gone");
      await vi.waitFor(() => expect(h.rows.has("gone")).toBe(false));
    });
  });

  describe("adoption", () => {
    it("adopts before the first request to Drive and tells the gallery", async () => {
      const h = setup({ local: [row("a", 100, "local", null)] });
      const changed = vi.fn();
      h.engine.onLocalRowsChanged(changed);
      await h.engine.start(OWNER);
      expect(h.store.adoptUnowned.mock.invocationCallOrder[0]).toBeLessThan(h.api.list.mock.invocationCallOrder[0]);
      expect(changed.mock.invocationCallOrder[0]).toBeLessThan(h.api.list.mock.invocationCallOrder[0]);
    });

    it("lets a stale adoption finish without touching the newer generation", async () => {
      const h = setup({ local: [row("a", 100, "dirty")] });
      const gate = pending<number>();
      h.store.adoptUnowned.mockImplementationOnce(() => gate.promise);
      const startedOld = h.engine.start("old-owner");
      await vi.waitFor(() => expect(h.store.adoptUnowned).toHaveBeenCalledWith("old-owner"));
      const stopped = h.engine.stop();
      const startedNew = h.engine.start(OWNER);
      gate.resolve(0);
      await Promise.all([stopped, startedOld, startedNew]);
      expect(h.store.adoptUnowned).toHaveBeenCalledTimes(2);
      expect(h.store.adoptUnowned).toHaveBeenLastCalledWith(OWNER);
      expect(h.rows.get("a")?.sync.state).toBe("synced");
      expect(h.status().phase).toBe("idle");
    });

    it("retries adoption on the next pass after it failed", async () => {
      const h = setup({ local: [row("a", 100, "local", null)] });
      h.store.adoptUnowned.mockRejectedValueOnce(new Error("quota"));
      await h.engine.start(OWNER);
      expect(h.status().phase).toBe("error");
      expect(h.api.list).not.toHaveBeenCalled();
      h.advance(1_000);
      await vi.waitFor(() => expect(h.rows.get("a")?.sync.state).toBe("synced"));
    });
  });

  describe("stop", () => {
    it("resolves promptly while the pass is still queued for a lock that never frees, and is idempotent", async () => {
      const h = setup();
      h.blockLock();
      const started = h.engine.start(OWNER);
      await h.engine.stop();
      await started;
      await h.engine.stop();
      expect(h.api.list).not.toHaveBeenCalled();
      expect(h.status()).toEqual(INITIAL_SYNC_STATUS);
    });

    it("is not held by a request that never answers: the request times out", async () => {
      const h = setup();
      h.api.list.mockImplementationOnce(() => new Promise(() => {}));
      const started = h.engine.start(OWNER);
      await vi.waitFor(() => expect(h.api.list).toHaveBeenCalled());
      const stopped = h.engine.stop();
      h.advance(30_000);
      await Promise.all([stopped, started]);
      expect(h.status()).toEqual(INITIAL_SYNC_STATUS);
      expect(h.pendingDelays()).toEqual([]);
    });

    it("treats a stalled request as a failure to retry with backoff", async () => {
      const h = setup({ local: [row("a", 100, "dirty")] });
      h.api.list.mockImplementationOnce(() => new Promise(() => {}));
      const started = h.engine.start(OWNER);
      await vi.waitFor(() => expect(h.api.list).toHaveBeenCalled());
      h.advance(30_000);
      await started;
      expect(h.status().phase).toBe("error");
      expect(h.pendingDelays()).toEqual([1_000]);
    });

    it("never touches the first owner's rows when another owner starts", async () => {
      const h = setup({ local: [row("mine", 50, "synced", "owner-a")] });
      const gate = pending<TApiResult<IGalleryListItem[]>>();
      h.api.list.mockImplementationOnce(() => gate.promise);
      const startedA = h.engine.start("owner-a");
      await vi.waitFor(() => expect(h.api.list).toHaveBeenCalled());
      const stopped = h.engine.stop();
      const startedB = h.engine.start("owner-b");
      gate.resolve({ ok: true, value: [] });
      await Promise.all([stopped, startedA, startedB]);
      expect(h.store.removeLocal).not.toHaveBeenCalled();
      expect(h.store.putFromRemote).not.toHaveBeenCalled();
      expect(h.rows.get("mine")).toMatchObject({ ownerId: "owner-a", updatedAt: 50, sync: { state: "synced" } });
    });
  });

  describe("a failing row does not starve the others", () => {
    const saveExceptFor = (h: ReturnType<typeof setup>, badId: string) => {
      const save = h.api.save.getMockImplementation()!;
      h.api.save.mockImplementation(async (request) =>
        request.artwork.id === badId ? { ok: false, kind: "failed", status: 400 } : save(request),
      );
    };

    it("skips a row Drive rejects, uploads the rest and schedules one backoff retry", async () => {
      const h = setup({ local: [row("bad", 100, "dirty"), row("ok1", 200, "dirty"), row("ok2", 300, "dirty")] });
      saveExceptFor(h, "bad");
      await h.engine.start(OWNER);
      expect(h.rows.get("ok1")?.sync.state).toBe("synced");
      expect(h.rows.get("ok2")?.sync.state).toBe("synced");
      expect(h.rows.get("bad")?.sync.state).toBe("dirty");
      expect(h.warn).toHaveBeenCalledWith(expect.any(String), "bad");
      expect(h.status()).toMatchObject({ phase: "error", pendingCount: 1 });
      expect(h.pendingDelays()).toEqual([1_000]);
      h.advance(1_000);
      await vi.waitFor(() => expect(h.api.save).toHaveBeenCalledTimes(4));
      await vi.waitFor(() => expect(h.pendingDelays()).toEqual([2_000]));
    });

    it("never sends an empty preview: a row with no usable thumbnail is skipped for the pass", async () => {
      const blank = { ...row("blank", 100, "dirty"), thumbnail: "" };
      const h = setup({ local: [blank, row("ok", 200, "dirty")] });
      h.setRender("");
      await h.engine.start(OWNER);
      expect(h.api.save).toHaveBeenCalledTimes(1);
      expect(h.api.save.mock.calls[0][0].artwork.id).toBe("ok");
      expect(h.rows.get("blank")?.sync.state).toBe("dirty");
      expect(h.status().phase).toBe("error");
      expect(h.pendingDelays()).toEqual([1_000]);
    });

    it("renders a fresh preview when the stored thumbnail is not current", async () => {
      const h = setup({ local: [row("a", 100, "dirty")] });
      h.setRender("data:image/png;base64,FRESH");
      await h.engine.start(OWNER);
      expect(h.api.save.mock.calls[0][0].previewPngBase64).toBe("FRESH");
    });

    it("still aborts the whole pass on a failure that is not the row's", async () => {
      const h = setup({ local: [row("a", 100, "dirty"), row("b", 200, "dirty")] });
      h.api.save.mockResolvedValueOnce({ ok: false, kind: "offline" });
      await h.engine.start(OWNER);
      expect(h.api.save).toHaveBeenCalledTimes(1);
      expect(h.status().phase).toBe("offline");
    });
  });

  describe("pending count", () => {
    it("is current when the pass ends offline, in error or in reauth", async () => {
      const h = setup({ local: [row("a", 100, "dirty"), row("b", 200, "synced")] });
      h.setOnline(false);
      await h.engine.start(OWNER);
      expect(h.status()).toMatchObject({ phase: "offline", pendingCount: 1 });
      await h.engine.stop();

      const r = setup({ local: [row("a", 100, "dirty"), row("b", 200, "dirty")] });
      r.api.list.mockResolvedValue({ ok: false, kind: "reauth" });
      await r.engine.start(OWNER);
      expect(r.status()).toMatchObject({ phase: "reauth", pendingCount: 2 });
    });

    it("follows local edits without waiting for a pass", async () => {
      const h = setup({ local: [row("a", 100, "synced")], remote: [row("a", 100, "synced")] });
      await h.engine.start(OWNER);
      expect(h.status().pendingCount).toBe(0);
      h.edit("a", 150);
      h.emitChange("a");
      await vi.waitFor(() => expect(h.status().pendingCount).toBe(1));
    });
  });
});
