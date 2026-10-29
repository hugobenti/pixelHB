import { describe, expect, it } from "vitest";
import { createDriveArtworkStore, driveFileBaseName } from "./driveArtworkStore";
import type { IDriveArtworkUpsert } from "./driveArtworkStore.type";

interface IRecordedCall { method: string; url: URL; headers: Headers; body: Uint8Array | null }

function recorder(responses: Array<Response | Error>) {
  const calls: IRecordedCall[] = [];
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = init?.body == null ? null : new Uint8Array(await new Response(init.body).arrayBuffer());
    calls.push({ method: init?.method ?? "GET", url: new URL(String(input)), headers: new Headers(init?.headers), body });
    const next = responses.shift();
    if (!next) throw new Error("unexpected Drive call");
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
  return { fetchFn, calls };
}
const latin1 = (bytes: Uint8Array | null) => new TextDecoder("latin1").decode(bytes ?? new Uint8Array());

const ID = "3f1c9a52-0000-4000-8000-000000000001";
const OTHER = "3f1c9a52-0000-4000-8000-000000000002";
const READABLE = "3f1c9a52-0000-4000-8000-000000000003";
const ROOT = { id: "root-1", name: "PixelHB", appProperties: { pixelhb: "root" } };
const json = (value: unknown) => Response.json(value);
const props = (updatedAt: number, overrides: Record<string, string | undefined> = {}) =>
  Object.fromEntries(Object.entries({
    pixelhb: "artwork", artworkId: ID, updatedAt: String(updatedAt), createdAt: "1000",
    width: "32", height: "16", formatVersion: "3", ...overrides,
  }).filter(([, v]) => v !== undefined)) as Record<string, string>;
const jsonFile = (fileId: string, updatedAt: number, overrides = {}, name = "Sunset cat.pixelhb.json") =>
  ({ id: fileId, name, appProperties: props(updatedAt, overrides) });
const pngFile = (fileId: string) => ({ id: fileId, name: "Sunset cat.png", appProperties: { pixelhb: "preview", artworkId: ID } });
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const input = (updatedAt: number): IDriveArtworkUpsert => ({
  id: ID, title: "Sunset cat", width: 32, height: 16, createdAt: 1000, updatedAt,
  artworkJson: '{"version":3}', previewPng: PNG,
});
const store = (fetchFn: typeof fetch) => createDriveArtworkStore({ accessToken: "tok", fetchFn });
const shape = (calls: IRecordedCall[]) =>
  calls.map((c) => [c.method, c.url.pathname, c.url.searchParams.get("uploadType")]);
function multipartMetadata(call: IRecordedCall): unknown {
  const boundary = (call.headers.get("Content-Type") ?? "").split("boundary=")[1];
  const part = latin1(call.body).split(`--${boundary}`)[1];
  return JSON.parse(part.slice(part.indexOf("\r\n\r\n") + 4).trim());
}
const FILES_OF_ID = `appProperties has { key='artworkId' and value='${ID}' } and trashed=false`;

describe("driveArtworkStore", () => {
  it("ensureRootFolder looks up by appProperties only, takes the oldest, and caches it", async () => {
    const { fetchFn, calls } = recorder([json({ files: [ROOT, { ...ROOT, id: "root-2" }] })]);
    const s = store(fetchFn);
    expect(await s.ensureRootFolder()).toBe("root-1");
    expect(await s.ensureRootFolder()).toBe("root-1");
    expect(calls).toHaveLength(1);
    const q = calls[0].url.searchParams.get("q");
    expect(q).toBe("appProperties has { key='pixelhb' and value='root' } and mimeType='application/vnd.google-apps.folder' and trashed=false");
    expect(q).not.toMatch(/\bname\b/);
    expect(calls[0].url.searchParams.get("orderBy")).toBe("createdTime");
  });

  it("ensureRootFolder creates the folder when the lookup is empty (user deleted it)", async () => {
    const { fetchFn, calls } = recorder([json({ files: [] }), json({ id: "root-new", name: "PixelHB" })]);
    expect(await store(fetchFn).ensureRootFolder()).toBe("root-new");
    expect(calls[1].method).toBe("POST");
    expect(calls[1].url.href).toBe("https://www.googleapis.com/drive/v3/files?fields=id%2Cname%2CappProperties");
    expect(JSON.parse(latin1(calls[1].body))).toEqual({
      name: "PixelHB", mimeType: "application/vnd.google-apps.folder", appProperties: { pixelhb: "root" },
    });
  });

  it("list pages through results, maps appProperties to items newest first, and never looks up the folder", async () => {
    const moon = { id: "f-b", name: "Moon.pixelhb.json", appProperties: props(5000, { artworkId: OTHER }) };
    const { fetchFn, calls } = recorder([
      json({ files: [jsonFile("f-a", 2000)], nextPageToken: "p2" }),
      json({ files: [moon] }),
      json({ files: [] }),
    ]);
    const { items, rootFolderTrashed } = await store(fetchFn).list();
    expect(rootFolderTrashed).toBe(false);
    expect(calls).toHaveLength(3);
    expect(calls[0].url.searchParams.get("q")).toBe("appProperties has { key='pixelhb' and value='artwork' } and trashed=false");
    expect(calls[1].url.searchParams.get("pageToken")).toBe("p2");
    expect(items).toEqual([
      { id: OTHER, title: "Moon", width: 32, height: 16, createdAt: 1000, updatedAt: 5000, previewUrl: `/api/gallery/${OTHER}/preview?v=5000` },
      { id: ID, title: "Sunset cat", width: 32, height: 16, createdAt: 1000, updatedAt: 2000, previewUrl: `/api/gallery/${ID}/preview?v=2000` },
    ]);
  });

  it("list skips files with missing or invalid appProperties and keeps the rest (hand-edited Drive)", async () => {
    const good = jsonFile("f-good", 2000);
    const bad = [
      { id: "b0", name: "x.pixelhb.json" },
      jsonFile("b1", 1, { updatedAt: "soon" }),
      jsonFile("b2", 1, { createdAt: undefined }),
      jsonFile("b3", 1, { width: "0" }),
      jsonFile("b4", 1, { height: "1.5" }),
      jsonFile("b5", 1, { formatVersion: "2" }),
      jsonFile("b6", 1, { artworkId: "bad id'" }),
    ];
    const { fetchFn } = recorder([json({ files: [...bad, good] }), json({ files: [] })]);
    const { items } = await store(fetchFn).list();
    expect(items.map((i) => i.id)).toEqual([ID]);
  });

  it("list reports the id of every marked file it cannot read, so the engine never treats it as absent", async () => {
    const files = [
      jsonFile("u1", 1, { formatVersion: "4" }, "Future.pixelhb.json"),
      jsonFile("u2", 1, { width: "0" }),
      jsonFile("u3", 1, { artworkId: "bad id'" }),
      jsonFile("u4", 1, { artworkId: undefined }),
      jsonFile("u5", 1, { artworkId: OTHER, updatedAt: "soon" }),
      { id: "u6", name: "foreign.json", appProperties: { pixelhb: "preview", artworkId: "nope" } },
      jsonFile("ok", 9, { artworkId: READABLE }),
    ];
    const { fetchFn } = recorder([json({ files }), json({ files: [] })]);
    const listing = await store(fetchFn).list();
    expect(listing.items.map((i) => i.id)).toEqual([READABLE]);
    expect([...listing.unreadableIds].sort()).toEqual([ID, OTHER].sort());
  });

  it("list reads formatVersion 3 forever: only another version is unreadable", async () => {
    const { fetchFn } = recorder([json({ files: [jsonFile("a", 5, { formatVersion: "3" }), jsonFile("b", 5, { formatVersion: "4", artworkId: OTHER })] }), json({ files: [] })]);
    const listing = await store(fetchFn).list();
    expect(listing.items.map((i) => i.id)).toEqual([ID]);
    expect(listing.unreadableIds).toEqual([OTHER]);
  });

  it("list keeps only the newest of duplicate JSON files for one artwork", async () => {
    const { fetchFn } = recorder([json({ files: [jsonFile("f-1", 2000), jsonFile("f-2", 3000)] }), json({ files: [] })]);
    expect((await store(fetchFn).list()).items.map((i) => i.updatedAt)).toEqual([3000]);
  });

  describe("rootFolderTrashed", () => {
    const TRASHED_ROOT = "appProperties has { key='pixelhb' and value='root' } and mimeType='application/vnd.google-apps.folder' and trashed=true";
    const LIVE_ROOT = TRASHED_ROOT.replace("trashed=true", "trashed=false");

    it("is false without a trashed PixelHB folder, after a single extra query", async () => {
      const { fetchFn, calls } = recorder([json({ files: [] }), json({ files: [] })]);
      expect((await store(fetchFn).list()).rootFolderTrashed).toBe(false);
      expect(calls).toHaveLength(2);
      expect(calls[1].url.searchParams.get("q")).toBe(TRASHED_ROOT);
    });

    it("is true when the folder is trashed and no live folder exists", async () => {
      const { fetchFn, calls } = recorder([json({ files: [] }), json({ files: [ROOT] }), json({ files: [] })]);
      expect((await store(fetchFn).list()).rootFolderTrashed).toBe(true);
      expect(calls[2].url.searchParams.get("q")).toBe(LIVE_ROOT);
    });

    it("is false when a live folder exists next to the trashed one (the app made a new folder)", async () => {
      const { fetchFn } = recorder([json({ files: [] }), json({ files: [ROOT] }), json({ files: [{ ...ROOT, id: "root-2" }] })]);
      expect((await store(fetchFn).list()).rootFolderTrashed).toBe(false);
    });

    it("fails the whole list when the folder query fails, never answering false on doubt", async () => {
      const { fetchFn } = recorder([json({ files: [] }), new Response(null, { status: 500 })]);
      await expect(store(fetchFn).list()).rejects.toThrow();
    });
  });

  it("get streams the newest artwork JSON; null when Drive has none", async () => {
    const { fetchFn, calls } = recorder([
      json({ files: [jsonFile("f-old", 1000), pngFile("p-1"), jsonFile("f-new", 2000)] }),
      new Response('{"version":3}'),
      json({ files: [] }),
    ]);
    const s = store(fetchFn);
    expect(await new Response(await s.get(ID)).text()).toBe('{"version":3}');
    expect(calls[0].url.searchParams.get("q")).toBe(FILES_OF_ID);
    expect(calls[1].url.href).toBe("https://www.googleapis.com/drive/v3/files/f-new?alt=media");
    expect(await s.get(ID)).toBeNull();
  });

  it("getPreview streams the PNG; null when only the JSON exists", async () => {
    const { fetchFn, calls } = recorder([
      json({ files: [jsonFile("f-1", 2000), pngFile("p-1")] }), new Response(PNG),
      json({ files: [jsonFile("f-1", 2000)] }),
    ]);
    const s = store(fetchFn);
    expect(new Uint8Array(await new Response(await s.getPreview(ID)).arrayBuffer())).toEqual(PNG);
    expect(calls[1].url.href).toBe("https://www.googleapis.com/drive/v3/files/p-1?alt=media");
    expect(await s.getPreview(ID)).toBeNull();
  });

  it("upsert of a new artwork creates PNG then JSON in the root folder", async () => {
    const { fetchFn, calls } = recorder([json({ files: [] }), json({ files: [ROOT] }), json({ id: "p-1" }), json({ id: "f-1" })]);
    expect(await store(fetchFn).upsert(input(2000))).toEqual({ kind: "saved", updatedAt: 2000 });
    expect(shape(calls)).toEqual([
      ["GET", "/drive/v3/files", null], ["GET", "/drive/v3/files", null],
      ["POST", "/upload/drive/v3/files", "multipart"], ["POST", "/upload/drive/v3/files", "multipart"],
    ]);
    expect(multipartMetadata(calls[2])).toEqual({
      name: "Sunset cat.png", mimeType: "image/png", parents: ["root-1"], appProperties: { pixelhb: "preview", artworkId: ID },
    });
    expect(multipartMetadata(calls[3])).toEqual({
      name: "Sunset cat.pixelhb.json", mimeType: "application/json", parents: ["root-1"], appProperties: props(2000),
    });
  });

  it("upsert over an older Drive copy updates both files in place without a folder lookup", async () => {
    const { fetchFn, calls } = recorder([json({ files: [jsonFile("f-1", 1500), pngFile("p-1")] }), json({ id: "p-1" }), json({ id: "f-1" })]);
    expect(await store(fetchFn).upsert(input(2000))).toEqual({ kind: "saved", updatedAt: 2000 });
    expect(shape(calls)).toEqual([
      ["GET", "/drive/v3/files", null],
      ["PATCH", "/upload/drive/v3/files/p-1", "multipart"], ["PATCH", "/upload/drive/v3/files/f-1", "multipart"],
    ]);
    expect(multipartMetadata(calls[2])).toEqual({ name: "Sunset cat.pixelhb.json", appProperties: props(2000) });
  });

  it("upsert updates the newest JSON and trashes duplicates left by a concurrent create", async () => {
    const { fetchFn, calls } = recorder([
      json({ files: [jsonFile("f-2", 1200), jsonFile("f-1", 1500), pngFile("p-1")] }),
      json({ id: "p-1" }), json({ id: "f-1" }), json({ id: "f-2" }),
    ]);
    await store(fetchFn).upsert(input(2000));
    expect(shape(calls).slice(1)).toEqual([
      ["PATCH", "/upload/drive/v3/files/p-1", "multipart"], ["PATCH", "/upload/drive/v3/files/f-1", "multipart"],
      ["PATCH", "/drive/v3/files/f-2", null],
    ]);
    expect(JSON.parse(latin1(calls[3].body))).toEqual({ trashed: true });
  });

  it("upsert returns conflict without writing when Drive is newer", async () => {
    const { fetchFn, calls } = recorder([json({ files: [jsonFile("f-1", 3000), pngFile("p-1")] })]);
    expect(await store(fetchFn).upsert(input(2000))).toEqual({ kind: "conflict", updatedAt: 3000 });
    expect(calls).toHaveLength(1);
  });

  it("upsert with the same updatedAt as Drive is a no-op success (retry after a lost response)", async () => {
    const { fetchFn, calls } = recorder([json({ files: [jsonFile("f-1", 2000), pngFile("p-1")] })]);
    expect(await store(fetchFn).upsert(input(2000))).toEqual({ kind: "saved", updatedAt: 2000 });
    expect(calls).toHaveLength(1);
  });

  it("trash is idempotent when nothing is left in Drive", async () => {
    const { fetchFn, calls } = recorder([json({ files: [] })]);
    expect(await store(fetchFn).trash(ID, 2500)).toEqual({ kind: "trashed" });
    expect(calls).toHaveLength(1);
  });

  it("trash returns conflict and trashes nothing when Drive was edited after the delete", async () => {
    const { fetchFn, calls } = recorder([json({ files: [jsonFile("f-1", 3000), pngFile("p-1")] })]);
    expect(await store(fetchFn).trash(ID, 2500)).toEqual({ kind: "conflict", updatedAt: 3000 });
    expect(calls).toHaveLength(1);
  });

  it("trash moves the JSON then the PNG to Drive trash when the delete is newer", async () => {
    const { fetchFn, calls } = recorder([json({ files: [pngFile("p-1"), jsonFile("f-1", 2000)] }), json({ id: "f-1" }), json({ id: "p-1" })]);
    expect(await store(fetchFn).trash(ID, 2500)).toEqual({ kind: "trashed" });
    expect(shape(calls).slice(1)).toEqual([["PATCH", "/drive/v3/files/f-1", null], ["PATCH", "/drive/v3/files/p-1", null]]);
  });

  it("driveFileBaseName strips control characters, collapses spaces, caps at 100, falls back to the id", () => {
    expect(driveFileBaseName("  Sun\u0000set\n  cat ", ID)).toBe("Sun set cat");
    expect(driveFileBaseName("   ", ID)).toBe(ID);
    expect(driveFileBaseName("a".repeat(150), ID)).toHaveLength(100);
  });

  it("escapes the artwork id in Drive queries", async () => {
    const { fetchFn, calls } = recorder([json({ files: [] })]);
    await store(fetchFn).get("a'b\\c");
    expect(calls[0].url.searchParams.get("q")).toBe(
      "appProperties has { key='artworkId' and value='a\\'b\\\\c' } and trashed=false",
    );
  });

  it("ensureRootFolder retries after a rejected first attempt", async () => {
    const { fetchFn, calls } = recorder([new TypeError("fetch failed"), json({ files: [ROOT] })]);
    const s = store(fetchFn);
    await expect(s.ensureRootFolder()).rejects.toMatchObject({ status: 0 });
    expect(await s.ensureRootFolder()).toBe("root-1");
    expect(calls).toHaveLength(2);
  });

  describe("status and findTrashed", () => {
    const TRASHED_OF_ID = `appProperties has { key='artworkId' and value='${ID}' } and trashed=true`;

    const explicit = (file: ReturnType<typeof jsonFile>) => ({ ...file, explicitlyTrashed: true });

    it("findTrashed queries trashed files of the artwork id and returns the newest readable updatedAt of explicitly trashed JSONs", async () => {
      const { fetchFn, calls } = recorder([
        json({
          files: [
            explicit(jsonFile("t1", 1500)),
            { ...pngFile("tp"), explicitlyTrashed: true },
            explicit(jsonFile("t2", 2500)),
            explicit(jsonFile("t3", 1, { updatedAt: "soon" })),
          ],
        }),
      ]);
      expect(await store(fetchFn).findTrashed(ID)).toEqual({ updatedAt: 2500 });
      expect(calls).toHaveLength(1);
      expect(calls[0].url.searchParams.get("q")).toBe(TRASHED_OF_ID);
    });

    it("findTrashed is null without an explicitly trashed artwork JSON (nothing, only a preview, unreadable stamps)", async () => {
      expect(await store(recorder([json({ files: [] })]).fetchFn).findTrashed(ID)).toBeNull();
      expect(await store(recorder([json({ files: [{ ...pngFile("tp"), explicitlyTrashed: true }] })]).fetchFn).findTrashed(ID)).toBeNull();
      expect(await store(recorder([json({ files: [explicit(jsonFile("t", 1, { updatedAt: "x" }))] })]).fetchFn).findTrashed(ID)).toBeNull();
    });

    it("findTrashed does not count a child trashed only through its folder: explicitlyTrashed false or missing is not evidence", async () => {
      const viaFolder = { ...jsonFile("t", 3000), explicitlyTrashed: false };
      expect(await store(recorder([json({ files: [viaFolder] })]).fetchFn).findTrashed(ID)).toBeNull();
      expect(await store(recorder([json({ files: [jsonFile("t", 3000)] })]).fetchFn).findTrashed(ID)).toBeNull();
    });

    it("status is present when a live JSON exists, without looking at the trash", async () => {
      const { fetchFn, calls } = recorder([json({ files: [jsonFile("f", 2000)] })]);
      expect(await store(fetchFn).status(ID)).toEqual({ state: "present", updatedAt: 2000 });
      expect(calls).toHaveLength(1);
    });

    it("status counts an unreadable live JSON as present (no updatedAt)", async () => {
      const { fetchFn } = recorder([json({ files: [jsonFile("f", 1, { formatVersion: "4", updatedAt: "x" })] })]);
      expect(await store(fetchFn).status(ID)).toEqual({ state: "present" });
    });

    it("status is trashed with the trashed copy's updatedAt when only the trash has it", async () => {
      const { fetchFn, calls } = recorder([json({ files: [] }), json({ files: [explicit(jsonFile("t", 3000))] })]);
      expect(await store(fetchFn).status(ID)).toEqual({ state: "trashed", updatedAt: 3000 });
      expect(calls[1].url.searchParams.get("q")).toBe(TRASHED_OF_ID);
    });

    it("status and findTrashed work detached from the store object", async () => {
      const { status, findTrashed } = store(recorder([json({ files: [] }), json({ files: [] }), json({ files: [] })]).fetchFn);
      expect(await status(ID)).toEqual({ state: "absent" });
      expect(await findTrashed(ID)).toBeNull();
    });

    it("status is absent, not trashed, for an artwork whose files are trashed only through their folder", async () => {
      const viaFolder = { ...jsonFile("t", 3000), explicitlyTrashed: false };
      const { fetchFn } = recorder([json({ files: [] }), json({ files: [viaFolder] })]);
      expect(await store(fetchFn).status(ID)).toEqual({ state: "absent" });
    });

    it("status is absent when neither the live nor the trashed set has the artwork", async () => {
      const { fetchFn } = recorder([json({ files: [] }), json({ files: [] })]);
      expect(await store(fetchFn).status(ID)).toEqual({ state: "absent" });
    });
  });
});
