/**
 * Purpose:
 * End-to-end data-safety scenarios: the real sync engine, local store (fake-indexeddb), browser API
 * client and `/api/gallery` route handlers over an in-memory fake of the Drive v3 REST API. Each case
 * is a way the engine used to lose a user's art (deletion inferred from a short or lagging Drive list,
 * wall-clock stamps, last-writer-wins) and asserts that the art is still there afterwards.
 */
import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/shared/auth/server/driveAccess", () => ({
  getDriveAccess: async () => ({ kind: "ok", accessToken: "tok" }),
}));
vi.mock("@/features/shared/auth/driveSyncFlag", () => ({ DRIVE_SYNC_ENABLED: true }));

import { serializeArtworkFile } from "@/features/shared/artwork/artworkFileFormat";
import * as artworkService from "@/features/shared/artwork/artworkService";
import * as syncStore from "@/features/shared/artwork/artworkSyncStore";
import { db } from "@/features/shared/db/dexie.config";
import { createGalleryApiClient } from "@/features/shared/drive/galleryApiClient";
import { createSyncEngine, INITIAL_SYNC_STATUS } from "./createSyncEngine";
import { syncStatusMessage } from "./logic/syncStatusMessage";
import type { ISyncStatus } from "./sync.type";

interface IFakeFile {
  id: string;
  name: string;
  appProperties: Record<string, string>;
  content: Uint8Array;
  mimeType: string;
  trashed: boolean;
  /** Trashed itself (not only through a trashed parent folder), as Drive v3 reports it. */
  explicitlyTrashed: boolean;
}

type TRouteHandler = (
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) => Promise<Response>;
interface IRoutes {
  list: { GET: (request: Request) => Promise<Response> };
  item: { GET: TRouteHandler; POST: TRouteHandler; DELETE: TRouteHandler };
  status: { GET: TRouteHandler };
}

const PNG = "data:image/png;base64,iVBORw0KGgo=";
const PNG_BASE64 = "iVBORw0KGgo=";
const YEAR_MS = 365 * 24 * 3_600_000;
const OWNER = "U1";

/** In-memory Google Drive v3: just the calls `driveRest.ts` makes. */
function createFakeDrive() {
  const files = new Map<string, IFakeFile>();
  let counter = 0;
  const state = {
    files,
    /** The list query answers as if no artwork existed (scope lost, index lag). */
    emptyList: false,
    /** The list query hides the files this predicate selects. */
    hideFromList: null as null | ((file: IFakeFile) => boolean),
    /** Every query answers empty, trashed or not (the app lost its `drive.file` access to the files). */
    scopeLost: false,
    /** Uploads answer 403 storageQuotaExceeded. */
    full: false,
    /** Trashing these Drive file ids answers this HTTP status. */
    failTrash: new Map<string, number>(),
  };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const view = (file: IFakeFile) => ({
    id: file.id,
    name: file.name,
    appProperties: file.appProperties,
    explicitlyTrashed: file.explicitlyTrashed,
  });
  const latin1 = (buffer: ArrayBuffer) => Buffer.from(buffer).toString("latin1");

  function parseMultipart(contentType: string, body: string) {
    const boundary = /boundary=(.+)$/.exec(contentType)![1];
    const parts = body
      .split(`--${boundary}`)
      .filter((part) => part.trim() !== "" && part.trim() !== "--");
    const content = (part: string) => part.slice(part.indexOf("\r\n\r\n") + 4).replace(/\r\n$/, "");
    return {
      metadata: JSON.parse(Buffer.from(content(parts[0]), "latin1").toString("utf8")),
      content: new Uint8Array(Buffer.from(content(parts[1]), "latin1")),
    };
  }

  async function fetchFn(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const url = new URL(String(input));
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    const path = url.pathname;
    if (path === "/drive/v3/files" && method === "GET") {
      const q = url.searchParams.get("q") ?? "";
      const wantTrashed = q.includes("trashed=true");
      const isList = q.includes("key='pixelhb' and value='artwork'");
      const byId = /key='artworkId' and value='(.*)' }/.exec(q)?.[1];
      let matches = state.scopeLost ? [] : [...files.values()].filter((file) => file.trashed === wantTrashed);
      if (q.includes("value='root'"))
        matches = matches.filter((file) => file.appProperties.pixelhb === "root");
      else if (isList) {
        matches = matches.filter((file) => file.appProperties.pixelhb === "artwork");
        if (state.emptyList) matches = [];
        if (state.hideFromList) matches = matches.filter((file) => !state.hideFromList!(file));
      } else if (byId !== undefined)
        matches = matches.filter((file) => file.appProperties.artworkId === byId);
      return json({ files: matches.map(view) });
    }
    if (path === "/drive/v3/files" && method === "POST") {
      const meta = JSON.parse(String(init.body));
      const file: IFakeFile = {
        id: `f${++counter}`,
        name: meta.name,
        appProperties: meta.appProperties ?? {},
        content: new Uint8Array(),
        mimeType: meta.mimeType,
        trashed: false,
        explicitlyTrashed: false,
      };
      files.set(file.id, file);
      return json(view(file));
    }
    if (path.startsWith("/upload/drive/v3/files")) {
      if (state.full) return json({ error: { errors: [{ reason: "storageQuotaExceeded" }] } }, 403);
      const raw = latin1(await new Response(init.body as BodyInit).arrayBuffer());
      const { metadata, content } = parseMultipart(headers.get("Content-Type")!, raw);
      if (method === "POST") {
        const file: IFakeFile = {
          id: `f${++counter}`,
          name: metadata.name,
          appProperties: metadata.appProperties ?? {},
          content,
          mimeType: metadata.mimeType,
          trashed: false,
          explicitlyTrashed: false,
        };
        files.set(file.id, file);
        return json(view(file));
      }
      const file = files.get(decodeURIComponent(path.split("/").pop()!))!;
      file.name = metadata.name ?? file.name;
      file.appProperties = { ...file.appProperties, ...(metadata.appProperties ?? {}) };
      file.content = content;
      return json(view(file));
    }
    const match = /^\/drive\/v3\/files\/(.+)$/.exec(path);
    if (match) {
      const id = decodeURIComponent(match[1]);
      const file = files.get(id);
      if (!file) return new Response(null, { status: 404 });
      if (method === "PATCH") {
        const failure = state.failTrash.get(id);
        if (failure) return json({ error: { errors: [{ reason: "invalid" }] } }, failure);
        if (JSON.parse(String(init.body)).trashed === true) {
          file.trashed = true;
          file.explicitlyTrashed = true;
        }
        return json({ id });
      }
      return new Response(file.content as BodyInit, { status: 200 });
    }
    return new Response(null, { status: 400 });
  }

  return {
    state,
    fetchFn,
    /** What the Drive UI does to a folder: every child becomes trashed with it, none of them explicitly. */
    trashEverything: () => files.forEach((file) => (file.trashed = true)),
    /** What the Drive UI does to one file: trashed itself. */
    trashFile: (file: IFakeFile) => {
      file.trashed = true;
      file.explicitlyTrashed = true;
    },
    liveArtworkFiles: () =>
      [...files.values()].filter(
        (file) => file.appProperties.pixelhb === "artwork" && !file.trashed,
      ),
    artworkFileOf: (id: string) =>
      [...files.values()].find(
        (file) => file.appProperties.artworkId === id && file.appProperties.pixelhb === "artwork",
      ),
  };
}

type TFakeDrive = ReturnType<typeof createFakeDrive>;

function makeDevice(routes: IRoutes) {
  const gallery = async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    const request = new Request(`http://localhost${path}`, init);
    if (path === "/api/gallery") return routes.list.GET(request);
    const [, , , rawId, tail] = path.split("?")[0].split("/");
    const ctx = { params: Promise.resolve({ id: decodeURIComponent(rawId) }) };
    if (tail === "status") return routes.status.GET(request, ctx);
    const method = (init?.method ?? "GET").toUpperCase() as "GET" | "POST" | "DELETE";
    return routes.item[method](request, ctx);
  };
  let status: ISyncStatus = INITIAL_SYNC_STATUS;
  const timers: Array<{ at: number; run: () => void; live: boolean }> = [];
  const engine = createSyncEngine({
    api: createGalleryApiClient(gallery as typeof fetch),
    store: syncStore,
    presence: {
      openIds: async () => new Set<string>(),
      waitForRelease: () => new Promise<void>(() => {}),
      runExclusive: (task) => task(),
    },
    environment: { isOnline: () => true, onOnline: () => () => {}, onHidden: () => () => {} },
    timers: {
      after: (ms, run) => {
        const timer = { at: Date.now() + ms, run, live: true };
        timers.push(timer);
        return () => {
          timer.live = false;
        };
      },
    },
    now: () => Date.now(),
    newId: () => crypto.randomUUID(),
    setStatus: (patch) => {
      status = { ...status, ...patch };
    },
    onArtworkChanged: artworkService.onArtworkChanged,
    renderThumbnail: () => PNG,
    warn: () => {},
  });
  return {
    engine,
    status: () => status,
    retryTimers: () => timers.filter((timer) => timer.live).length,
  };
}

const input = (title: string) => ({ title, width: 2, height: 2, backgroundColor: "#1A1C2C" });
const signedIn = {
  status: "signedIn" as const,
  user: { id: OWNER, name: "Ada", email: "a@b.c", image: null },
  needsReauth: false,
};

let drive: TFakeDrive;
let routes: IRoutes;

beforeAll(async () => {
  routes = {
    list: await import("@/app/api/gallery/route"),
    item: await import("@/app/api/gallery/[id]/route"),
    status: await import("@/app/api/gallery/[id]/status/route"),
  } as IRoutes;
});

beforeEach(async () => {
  vi.restoreAllMocks();
  artworkService.setActiveOwner(null);
  await db.artworks.clear();
  await db.deletions.clear();
  await db.removedArtworks.clear();
  drive = createFakeDrive();
  vi.stubGlobal("fetch", drive.fetchFn);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

/** Creates `count` artworks for the owner and syncs them to the fake Drive. */
async function seedSynced(count: number) {
  artworkService.setActiveOwner(OWNER);
  for (let i = 0; i < count; i++) await artworkService.createArtwork(input(`Art ${i}`));
  const device = makeDevice(routes);
  await device.engine.start(OWNER);
  return device;
}

const rows = () => db.artworks.toArray();
const syncedRows = async () => (await rows()).filter((row) => row.sync.state === "synced");

async function postFromAnotherDevice(id: string, patch: { title: string; updatedAt: number }) {
  const base = (await syncStore.getStored(id))!;
  const body = new Blob([
    JSON.stringify({
      artwork: serializeArtworkFile({ ...base, ...patch }),
      previewPngBase64: PNG_BASE64,
    }),
  ]);
  const gzipped = await new Response(
    body.stream().pipeThrough(new CompressionStream("gzip")),
  ).arrayBuffer();
  return routes.item.POST(
    new Request(`http://localhost/api/gallery/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" },
      body: gzipped,
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("deletion needs positive evidence", () => {
  it("a trashed PixelHB folder (every child trashed) removes nothing and says so", async () => {
    const device = await seedSynced(3);
    drive.trashEverything();
    await device.engine.syncNow();
    expect(await rows()).toHaveLength(3);
    expect(await db.removedArtworks.count()).toBe(0);
    expect(device.status()).toMatchObject({ driveFolderTrashed: true, missingInDriveIds: [] });
    expect(syncStatusMessage(signedIn, device.status())?.key).toBe("driveFolderTrashed");
    await device.engine.stop();
  });

  it("a new live PixelHB folder (recreated by one upload) does not turn the old children into deletions", async () => {
    const device = await seedSynced(3);
    const oldIds = (await rows()).map((row) => row.id).sort();
    drive.trashEverything();
    artworkService.setActiveOwner(OWNER);
    await artworkService.createArtwork(input("Made after the folder was trashed"));
    await device.engine.syncNow();
    expect(
      [...drive.state.files.values()].some(
        (file) => file.appProperties.pixelhb === "root" && !file.trashed,
      ),
    ).toBe(true);
    await device.engine.syncNow();
    const kept = (await syncedRows()).map((row) => row.id);
    for (const id of oldIds) expect(kept).toContain(id);
    expect(await db.removedArtworks.count()).toBe(0);
    await device.engine.stop();
  });

  it("an artwork trashed on its own while others sit in a live folder is removed", async () => {
    const device = await seedSynced(3);
    const [victim, ...rest] = await rows();
    drive.trashFile(drive.artworkFileOf(victim.id)!);
    await device.engine.syncNow();
    expect((await rows()).map((row) => row.id).sort()).toEqual(rest.map((row) => row.id).sort());
    expect((await syncStore.listRemoved(OWNER)).map((row) => row.id)).toEqual([victim.id]);
    await device.engine.stop();
  });

  it("restoring the trashed folder brings the sync back, nothing was lost", async () => {
    const device = await seedSynced(3);
    drive.trashEverything();
    await device.engine.syncNow();
    for (const file of drive.state.files.values()) file.trashed = false;
    await device.engine.syncNow();
    expect(await syncedRows()).toHaveLength(3);
    expect(device.status()).toMatchObject({ driveFolderTrashed: false, missingInDriveIds: [] });
    await device.engine.stop();
  });

  it("five artworks each trashed in Drive on their own are all moved to the removed table", async () => {
    const device = await seedSynced(5);
    for (const file of drive.state.files.values()) {
      if (file.appProperties.pixelhb === "artwork" || file.appProperties.pixelhb === "preview") drive.trashFile(file);
    }
    await device.engine.syncNow();
    expect(await rows()).toHaveLength(0);
    expect(await db.removedArtworks.count()).toBe(5);
    expect(device.status()).toMatchObject({ driveFolderTrashed: false, missingInDriveIds: [] });
    await device.engine.stop();
  });

  it("artworks deleted forever in Drive stay on this device, are marked, and can be deleted here", async () => {
    const device = await seedSynced(3);
    const ids = (await rows()).map((row) => row.id).sort();
    drive.state.files.clear();
    await device.engine.syncNow();
    expect(await syncedRows()).toHaveLength(3);
    expect(device.status().missingInDriveIds).toEqual(ids);
    expect(syncStatusMessage(signedIn, device.status())).toMatchObject({ key: "missingInDrive", count: 3 });

    artworkService.setActiveOwner(OWNER);
    expect(await artworkService.deleteArtwork(ids[0])).toBe(true);
    await device.engine.syncNow();
    expect(await db.artworks.get(ids[0])).toBeUndefined();
    expect(await db.deletions.count()).toBe(0);
    expect(device.status().missingInDriveIds).toEqual(ids.slice(1));
    await device.engine.stop();
  });

  it("an empty Drive answer (scope lost, client id changed) removes nothing", async () => {
    const device = await seedSynced(3);
    drive.state.scopeLost = true;
    await device.engine.syncNow();
    expect(await syncedRows()).toHaveLength(3);
    expect(await db.removedArtworks.count()).toBe(0);
    expect(drive.liveArtworkFiles()).toHaveLength(3);
    await device.engine.stop();
  });

  it("a list that answers empty while the files are still there removes nothing", async () => {
    const device = await seedSynced(3);
    drive.state.emptyList = true;
    await device.engine.syncNow();
    expect(await syncedRows()).toHaveLength(3);
    expect(device.status().missingInDriveIds).toEqual([]);
    await device.engine.stop();
  });

  it("an artwork whose Drive file this build cannot read stays, and its Drive file is untouched", async () => {
    const device = await seedSynced(3);
    const victim = drive.liveArtworkFiles()[0];
    victim.appProperties.formatVersion = "4";
    await device.engine.syncNow();
    expect(await syncedRows()).toHaveLength(3);
    expect(victim.trashed).toBe(false);
    expect(device.status().missingInDriveIds).toEqual([]);
    await device.engine.stop();
  });

  it("a list that lags behind an upload does not remove the fresh row, and it never leaves the gallery", async () => {
    artworkService.setActiveOwner(OWNER);
    const device = makeDevice(routes);
    await artworkService.createArtwork(input("Fresh"));
    await artworkService.createArtwork(input("Other"));
    await device.engine.start(OWNER);
    const [fresh] = await rows();
    drive.state.hideFromList = (file) => file.appProperties.artworkId === fresh.id;
    await device.engine.syncNow();
    expect(await syncedRows()).toHaveLength(2);
    expect(await db.removedArtworks.count()).toBe(0);
    expect(device.status().missingInDriveIds).toEqual([]);
    await device.engine.stop();
  });

  it("an artwork deleted on another device is moved to the removed table and can be restored and re-uploaded", async () => {
    const device = await seedSynced(3);
    const [first, ...rest] = await rows();
    await routes.item.DELETE(
      new Request(`http://localhost/api/gallery/${first.id}`, {
        method: "DELETE",
        body: JSON.stringify({ deletedAt: first.updatedAt }),
      }),
      { params: Promise.resolve({ id: first.id }) },
    );
    expect(drive.artworkFileOf(first.id)?.trashed).toBe(true);
    await device.engine.syncNow();
    expect((await rows()).map((row) => row.id).sort()).toEqual(rest.map((row) => row.id).sort());
    expect((await syncStore.listRemoved(OWNER)).map((row) => row.id)).toEqual([first.id]);
    expect(device.status().missingInDriveIds).toEqual([]);

    expect(await syncStore.restoreRemoved(first.id, OWNER)).toBe(true);
    await device.engine.syncNow();
    expect(await db.artworks.get(first.id)).toMatchObject({ sync: { state: "synced" } });
    expect(drive.liveArtworkFiles().map((file) => file.appProperties.artworkId)).toContain(
      first.id,
    );
    await device.engine.stop();
  });

  it("the status route tells live, trashed and absent apart", async () => {
    await seedSynced(1);
    const [{ id }] = await rows();
    const ask = async (artworkId: string) =>
      (
        await routes.status.GET(new Request(`http://localhost/api/gallery/${artworkId}/status`), {
          params: Promise.resolve({ id: artworkId }),
        })
      ).json();
    expect(await ask(id)).toEqual({ state: "present", updatedAt: expect.any(Number) });
    expect(await ask("never-existed")).toEqual({ state: "absent" });
    drive.trashEverything();
    expect(await ask(id)).toEqual({ state: "absent" }); // trashed only through its folder
    drive.trashFile(drive.artworkFileOf(id)!);
    expect(await ask(id)).toEqual({ state: "trashed", updatedAt: expect.any(Number) });
  });
});

describe("clock safety", () => {
  it("the server refuses a timestamp a year ahead and leaves Drive's copy alone", async () => {
    await seedSynced(1);
    const [{ id }] = await rows();
    const before = drive.artworkFileOf(id)!.appProperties.updatedAt;
    const response = await postFromAnotherDevice(id, {
      title: "FROM-FAST-CLOCK",
      updatedAt: Date.now() + YEAR_MS,
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ code: "clock_skew" });
    expect(drive.artworkFileOf(id)!.appProperties.updatedAt).toBe(before);
  });

  it("a device with a fast clock is told so, keeps its edit, and syncs again once its clock is right", async () => {
    artworkService.setActiveOwner(OWNER);
    const device = makeDevice(routes);
    await artworkService.createArtwork(input("Mine"));
    await device.engine.start(OWNER);
    const [{ id }] = await rows();

    const real = Date.now();
    const fast = vi.spyOn(Date, "now").mockReturnValue(real + YEAR_MS);
    await artworkService.renameArtwork(id, "Edited on a fast clock");
    fast.mockRestore();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await device.engine.syncNow();
    expect(await syncStore.getStored(id)).toMatchObject({
      title: "Edited on a fast clock",
      sync: { state: "dirty" },
    });
    expect(device.status().clockSkewIds).toEqual([id]);
    expect(syncStatusMessage(signedIn, device.status())).toMatchObject({
      key: "clockSkew",
      count: 1,
    });

    // The clock is corrected; the next edit must not stay stuck behind the refused future stamp.
    await artworkService.renameArtwork(id, "Edited on a right clock");
    const after = (await syncStore.getStored(id))!;
    expect(after.updatedAt).toBeLessThan(real + 60_000);
    await device.engine.syncNow();
    expect(await syncStore.getStored(id)).toMatchObject({
      title: "Edited on a right clock",
      sync: { state: "synced" },
    });
    expect(device.status().clockSkewIds).toEqual([]);
    await device.engine.stop();
  });

  it("an edit made after the clock stepped back is not reverted by the Drive copy", async () => {
    artworkService.setActiveOwner(OWNER);
    const device = makeDevice(routes);
    const start = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(start);
    await artworkService.createArtwork(input("Mine"));
    await device.engine.start(OWNER);
    const [{ id }] = await rows();
    vi.spyOn(Date, "now").mockReturnValue(start + 60_000);
    await artworkService.renameArtwork(id, "Edit one");
    await device.engine.syncNow();
    vi.spyOn(Date, "now").mockReturnValue(start + 10_000); // NTP stepped the clock back
    await artworkService.renameArtwork(id, "Edit two");
    await device.engine.syncNow();
    expect(await syncStore.getStored(id)).toMatchObject({
      title: "Edit two",
      sync: { state: "synced" },
    });
    expect(drive.artworkFileOf(id)!.appProperties.updatedAt).toBe(
      String((await syncStore.getStored(id))!.updatedAt),
    );
    await device.engine.stop();
  });

  it("a local edit that lost to a newer Drive copy is kept as a conflict copy, and uploaded", async () => {
    artworkService.setActiveOwner(OWNER);
    const device = makeDevice(routes);
    const start = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(start);
    await artworkService.createArtwork(input("Sunset"));
    await device.engine.start(OWNER);
    const [{ id }] = await rows();

    // Another device saves a newer version first; this device edited the old one meanwhile.
    expect(
      (
        await postFromAnotherDevice(id, {
          title: "Sunset (other device)",
          updatedAt: start + 20_000,
        })
      ).status,
    ).toBe(200);
    vi.spyOn(Date, "now").mockReturnValue(start + 10_000);
    await artworkService.renameArtwork(id, "Sunset (my edit)");
    await device.engine.syncNow();
    await device.engine.syncNow();

    const all = await rows();
    expect(all).toHaveLength(2);
    expect(all.find((row) => row.id === id)).toMatchObject({
      title: "Sunset (other device)",
      sync: { state: "synced" },
    });
    const copy = all.find((row) => row.id !== id)!;
    expect(copy).toMatchObject({
      title: "Sunset (my edit) (conflict copy)",
      ownerId: OWNER,
      sync: { state: "synced" },
    });
    expect(
      drive
        .liveArtworkFiles()
        .map((file) => file.name)
        .sort(),
    ).toEqual([
      "Sunset (my edit) (conflict copy).pixelhb.json",
      "Sunset (other device).pixelhb.json",
    ]);
    await device.engine.stop();
  });
});

describe("smaller sync fixes", () => {
  it("a tombstone Drive refuses does not stop the rest of the pass", async () => {
    artworkService.setActiveOwner(OWNER);
    const device = makeDevice(routes);
    await artworkService.createArtwork(input("Doomed"));
    await artworkService.createArtwork(input("Other"));
    await device.engine.start(OWNER);
    const [doomed] = (await rows()).filter((row) => row.title === "Doomed");
    for (const file of drive.state.files.values()) {
      if (file.appProperties.artworkId === doomed.id) drive.state.failTrash.set(file.id, 400);
    }
    await artworkService.deleteArtwork(doomed.id);
    await artworkService.createArtwork(input("Brand new"));
    await device.engine.syncNow();
    expect(await db.deletions.count()).toBe(1);
    expect((await rows()).find((row) => row.title === "Brand new")?.sync.state).toBe("synced");
    expect(await db.artworks.get(doomed.id)).toBeUndefined();
    expect(device.status().phase).toBe("error");
    expect(device.retryTimers()).toBeGreaterThan(0);
    await device.engine.stop();
  });

  it("a full Google Drive reads as full, not as offline", async () => {
    artworkService.setActiveOwner(OWNER);
    const device = makeDevice(routes);
    await artworkService.createArtwork(input("Mine"));
    drive.state.full = true;
    await device.engine.start(OWNER);
    expect(device.status()).toMatchObject({ phase: "error", driveFull: true });
    expect(syncStatusMessage(signedIn, device.status())?.key).toBe("driveFull");
    expect((await rows())[0].sync.state).toBe("dirty");
    drive.state.full = false;
    await device.engine.syncNow();
    expect(device.status()).toMatchObject({ phase: "idle", driveFull: false });
    await device.engine.stop();
  });
});
