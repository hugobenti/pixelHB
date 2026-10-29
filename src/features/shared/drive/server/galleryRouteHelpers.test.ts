import { beforeEach, describe, expect, it, vi } from "vitest";
import { serializeArtworkFile } from "@/features/shared/artwork/artworkFileFormat";
import { getDriveAccess } from "@/features/shared/auth/server/driveAccess";
import { MAX_CLOCK_SKEW_MS } from "../galleryApi";
import { DriveError } from "./driveRest";
import { driveErrorToResponse, readDeleteRequest, readSaveRequest, withGalleryAccess } from "./galleryRouteHelpers";

vi.mock("@/features/shared/auth/server/driveAccess", () => ({ getDriveAccess: vi.fn() }));
vi.mock("@/features/shared/auth/driveSyncFlag", () => ({ DRIVE_SYNC_ENABLED: true }));

const ID = "3f1c9a52-0000-4000-8000-000000000001";
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const artwork = serializeArtworkFile({
  id: ID, title: "Sunset cat", width: 2, height: 2, createdAt: 1000, updatedAt: 2000,
  thumbnail: "", palette: ["#000000"], activeLayerId: "l1",
  layers: [{ id: "l1", name: "Layer 1", visible: true, pixelData: new Uint8Array(4) }],
});
const URL_ = `http://localhost/api/gallery/${ID}`;
async function gzip(text: string): Promise<ArrayBuffer> {
  return new Response(new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
}
async function saveRequest(value: unknown): Promise<Request> {
  return new Request(URL_, {
    method: "POST", headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" },
    body: await gzip(JSON.stringify(value)),
  });
}
const BAD = { ok: false, status: 400, code: "bad_request" };
const TOO_LARGE = { ok: false, status: 413, code: "too_large" };
const SKEW = { ok: false, status: 400, code: "clock_skew" };
const NOW = 1_000_000_000_000;

describe("galleryRouteHelpers", () => {
  beforeEach(() => vi.mocked(getDriveAccess).mockReset());

  it.each([
    ["Drive 401 (revoked)", new DriveError(401, "authError", null), 401, { code: "reauth" }, null],
    ["Drive 429 with Retry-After", new DriveError(429, "rateLimitExceeded", "7"), 503, { code: "drive_unavailable" }, "7"],
    ["Drive 500", new DriveError(500, null, null), 503, { code: "drive_unavailable" }, "30"],
    ["Drive 403 userRateLimitExceeded", new DriveError(403, "userRateLimitExceeded", null), 503, { code: "drive_unavailable" }, "30"],
    ["network to Google", new DriveError(0, "network", null), 503, { code: "drive_unavailable" }, "30"],
    ["Drive 403 storageQuotaExceeded", new DriveError(403, "storageQuotaExceeded", null), 502, { code: "drive_error" }, null],
    ["Drive 400", new DriveError(400, "badRequest", null), 502, { code: "drive_error" }, null],
  ])("driveErrorToResponse maps %s", async (_label, error, status, body, retryAfter) => {
    const response = driveErrorToResponse(error);
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual(body);
    expect(response.headers.get("Retry-After")).toBe(retryAfter);
  });

  it("readSaveRequest gunzips, validates the v3 file and returns the store input", async () => {
    const result = await readSaveRequest(await saveRequest({ artwork, previewPngBase64: PNG_BASE64 }), ID);
    expect(result).toEqual({
      ok: true,
      upsert: {
        id: ID, title: "Sunset cat", width: 2, height: 2, createdAt: 1000, updatedAt: 2000,
        artworkJson: JSON.stringify(artwork),
        previewPng: new Uint8Array(Buffer.from(PNG_BASE64, "base64")),
      },
    });
  });

  it.each([
    ["artwork id differs from the route id", { artwork: { ...artwork, id: "other-id" }, previewPngBase64: PNG_BASE64 }],
    ["a v2 file (no id/timestamps)", { artwork: { ...artwork, version: 2 }, previewPngBase64: PNG_BASE64 }],
    ["a data: URL instead of raw base64", { artwork, previewPngBase64: `data:image/png;base64,${PNG_BASE64}` }],
    ["a preview that is not a PNG", { artwork, previewPngBase64: "aGVsbG8=" }],
    ["missing preview", { artwork }],
    ["a non-object body", [1, 2, 3]],
  ])("readSaveRequest rejects %s with 400", async (_label, body) => {
    expect(await readSaveRequest(await saveRequest(body), ID)).toEqual(BAD);
  });

  it("readSaveRequest rejects a body that claims gzip but is not", async () => {
    const request = new Request(URL_, { method: "POST", headers: { "Content-Encoding": "gzip" }, body: "{}" });
    expect(await readSaveRequest(request, ID)).toEqual(BAD);
  });

  it("readSaveRequest returns 413 when the compressed body exceeds the cap", async () => {
    const request = new Request(URL_, { method: "POST", headers: { "Content-Encoding": "gzip" }, body: new Uint8Array(1025) });
    expect(await readSaveRequest(request, ID, { maxCompressedBytes: 1024, maxInflatedBytes: 1_000_000 })).toEqual(TOO_LARGE);
  });

  it("readSaveRequest returns 413 when the inflated body exceeds the cap (gzip bomb)", async () => {
    const request = await saveRequest({ pad: "0".repeat(20_000) });
    expect(await readSaveRequest(request, ID, { maxCompressedBytes: 1_000_000, maxInflatedBytes: 10_000 })).toEqual(TOO_LARGE);
  });

  it.each([
    [{ deletedAt: 1700 }, { ok: true, deletedAt: 1700 }],
    [{ deletedAt: -1 }, BAD],
    [{ deletedAt: "1700" }, BAD],
    [{}, BAD],
  ])("readDeleteRequest(%j)", async (body, expected) => {
    const request = new Request(URL_, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    expect(await readDeleteRequest(request)).toEqual(expected);
  });

  it("readDeleteRequest returns 413 for an oversized body", async () => {
    const request = new Request(URL_, { method: "DELETE", body: JSON.stringify({ deletedAt: 1, pad: "0".repeat(4096) }) });
    expect(await readDeleteRequest(request)).toEqual(TOO_LARGE);
  });

  it.each([
    ["reauth", { kind: "reauth" }, 401, { code: "reauth" }],
    ["unauthenticated", { kind: "unauthenticated" }, 401, { code: "unauthenticated" }],
    ["unavailable", { kind: "unavailable" }, 503, { code: "drive_unavailable" }],
  ] as const)("withGalleryAccess answers %s without running the handler", async (_label, access, status, body) => {
    vi.mocked(getDriveAccess).mockResolvedValue(access);
    const run = vi.fn();
    const response = await withGalleryAccess(new Request(URL_), ID, run);
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual(body);
    expect(run).not.toHaveBeenCalled();
  });

  it("withGalleryAccess rejects a malformed id before touching auth", async () => {
    const response = await withGalleryAccess(new Request(URL_), "x' or name contains '", vi.fn());
    expect(response.status).toBe(400);
    expect(getDriveAccess).not.toHaveBeenCalled();
  });

  it("withGalleryAccess runs the handler with a store and maps a Drive 401 thrown inside to reauth", async () => {
    vi.mocked(getDriveAccess).mockResolvedValue({ kind: "ok", accessToken: "tok" });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json({ files: [] }));
    try {
      const ok = await withGalleryAccess(new Request(URL_), ID, async (store) => {
        expect(await store.list()).toEqual({ items: [], unreadableIds: [], rootFolderTrashed: false });
        return new Response(null, { status: 204 });
      });
      expect(ok.status).toBe(204);
      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain("https://www.googleapis.com/drive/v3/files");
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer tok");
    } finally {
      fetchSpy.mockRestore();
    }
    const revoked = await withGalleryAccess(new Request(URL_), ID, async () => {
      throw new DriveError(401, "authError", null);
    });
    expect(revoked.status).toBe(401);
    expect(await revoked.json()).toEqual({ code: "reauth" });
  });

  it("withGalleryAccess answers a bare 404 without touching auth when the flag is off", async () => {
    vi.resetModules();
    vi.doMock("@/features/shared/auth/driveSyncFlag", () => ({ DRIVE_SYNC_ENABLED: false }));
    try {
      const gated = await import("./galleryRouteHelpers");
      const access = await import("@/features/shared/auth/server/driveAccess");
      const run = vi.fn();
      const response = await gated.withGalleryAccess(new Request(URL_), ID, run);
      expect(response.status).toBe(404);
      expect(await response.text()).toBe("");
      expect(access.getDriveAccess).not.toHaveBeenCalled();
      expect(run).not.toHaveBeenCalled();
    } finally {
      vi.doMock("@/features/shared/auth/driveSyncFlag", () => ({ DRIVE_SYNC_ENABLED: true }));
    }
  });

  it("readSaveRequest drops unknown keys from the stored JSON", async () => {
    const withExtras = { ...artwork, evil: "x".repeat(10), layers: artwork.layers.map((l) => ({ ...l, extra: 1 })) };
    const result = await readSaveRequest(await saveRequest({ artwork: withExtras, previewPngBase64: PNG_BASE64 }), ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.upsert.artworkJson).toBe(JSON.stringify(artwork));
      expect(result.upsert.artworkJson).not.toContain("evil");
    }
  });

  it.each([
    ["updatedAt", { updatedAt: 2 ** 60 }],
    ["createdAt", { createdAt: 1e21 }],
  ])("readSaveRequest rejects an unsafe %s with 400", async (_label, override) => {
    const request = await saveRequest({ artwork: { ...artwork, ...override }, previewPngBase64: PNG_BASE64 });
    expect(await readSaveRequest(request, ID)).toEqual(BAD);
  });

  describe("clock safety", () => {
    const stamped = async (updatedAt: number) =>
      saveRequest({ artwork: { ...artwork, updatedAt }, previewPngBase64: PNG_BASE64 });

    it("readSaveRequest accepts an updatedAt up to the tolerance ahead of the server clock", async () => {
      const result = await readSaveRequest(await stamped(NOW + MAX_CLOCK_SKEW_MS), ID, undefined, NOW);
      expect(result.ok).toBe(true);
    });

    it("readSaveRequest rejects an updatedAt beyond the tolerance with clock_skew", async () => {
      expect(await readSaveRequest(await stamped(NOW + MAX_CLOCK_SKEW_MS + 1), ID, undefined, NOW)).toEqual(SKEW);
    });

    it("readSaveRequest still answers bad_request for an unsafe integer before the clock check", async () => {
      expect(await readSaveRequest(await stamped(2 ** 60), ID, undefined, NOW)).toEqual(BAD);
    });

    it("readDeleteRequest rejects a deletedAt beyond the tolerance with clock_skew and accepts one at it", async () => {
      const deleteRequest = (deletedAt: number) => new Request(URL_, { method: "DELETE", body: JSON.stringify({ deletedAt }) });
      expect(await readDeleteRequest(deleteRequest(NOW + MAX_CLOCK_SKEW_MS + 1), NOW)).toEqual(SKEW);
      expect(await readDeleteRequest(deleteRequest(NOW + MAX_CLOCK_SKEW_MS), NOW)).toEqual({ ok: true, deletedAt: NOW + MAX_CLOCK_SKEW_MS });
    });
  });
});
