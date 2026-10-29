import { beforeEach, describe, expect, it, vi } from "vitest";
import { serializeArtworkFile } from "@/features/shared/artwork/artworkFileFormat";
import { getDriveAccess } from "@/features/shared/auth/server/driveAccess";
import { MAX_CLOCK_SKEW_MS, MAX_INFLATED_BODY_BYTES } from "../galleryApi";
import type { IDrivePreview } from "./driveArtworkStore.type";
import { DriveError } from "./driveRest";
import {
  checkMutationRequest,
  driveErrorToResponse,
  galleryErrorResponse,
  galleryNotFoundResponse,
  gallerySavedResponse,
  galleryTrashedResponse,
  previewEtag,
  previewResponse,
  readDeleteRequest,
  readSaveRequest,
  withGalleryAccess,
} from "./galleryRouteHelpers";

vi.mock("@/features/shared/auth/server/driveAccess", () => ({ getDriveAccess: vi.fn() }));

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
    ["a Drive call that timed out", new DriveError(0, "timeout", null), 503, { code: "drive_unavailable" }, "30"],
    ["Drive 403 storageQuotaExceeded", new DriveError(403, "storageQuotaExceeded", null), 507, { code: "drive_full" }, null],
    ["Drive 403 another reason", new DriveError(403, "insufficientFilePermissions", null), 502, { code: "drive_error" }, null],
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

describe("mutation request guard (CSRF defence in depth)", () => {
  beforeEach(() => vi.mocked(getDriveAccess).mockReset());

  const FORBIDDEN = { ok: false, status: 403, code: "forbidden" };
  const UNSUPPORTED = { ok: false, status: 415, code: "unsupported_media_type" };
  const mutation = (headers: Record<string, string>, method = "POST") => new Request(URL_, { method, headers, body: "{}" });
  const JSON_CT = { "Content-Type": "application/json" };

  it.each([
    ["a same-origin browser request", { ...JSON_CT, Origin: "http://localhost", "Sec-Fetch-Site": "same-origin" }],
    ["a non-browser client (no Origin, no Sec-Fetch-Site)", JSON_CT],
    ["a JSON content type with parameters", { "Content-Type": "Application/JSON; charset=utf-8" }],
    ["the gzip save body", { ...JSON_CT, "Content-Encoding": "gzip", Origin: "http://localhost", "Sec-Fetch-Site": "same-origin" }],
    ["a same-origin Origin without Sec-Fetch-Site (older browser)", { ...JSON_CT, Origin: "http://localhost" }],
    [
      "the public Origin behind a proxy (X-Forwarded-Host)",
      { ...JSON_CT, Origin: "https://pixelhb.vercel.app", "X-Forwarded-Host": "pixelhb.vercel.app", "Sec-Fetch-Site": "same-origin" },
    ],
  ])("accepts %s", (_label, headers) => {
    expect(checkMutationRequest(mutation(headers))).toBeNull();
  });

  it.each([
    ["Sec-Fetch-Site cross-site", { ...JSON_CT, "Sec-Fetch-Site": "cross-site" }],
    ["Sec-Fetch-Site same-site (a sibling subdomain)", { ...JSON_CT, "Sec-Fetch-Site": "same-site" }],
    ["Sec-Fetch-Site none (not a page of this site)", { ...JSON_CT, "Sec-Fetch-Site": "none" }],
    ["an Origin that is not the proxied host", { ...JSON_CT, Origin: "http://localhost", "X-Forwarded-Host": "pixelhb.vercel.app" }],
    ["an Origin of another site", { ...JSON_CT, Origin: "https://evil.example", "Sec-Fetch-Site": "same-origin" }],
    ["an Origin of another port", { ...JSON_CT, Origin: "http://localhost:4061" }],
    ["an opaque Origin (null)", { ...JSON_CT, Origin: "null" }],
    ["a cross-site request with a form content type", { "Content-Type": "text/plain", "Sec-Fetch-Site": "cross-site" }],
  ])("refuses %s with 403 forbidden", (_label, headers) => {
    expect(checkMutationRequest(mutation(headers))).toEqual(FORBIDDEN);
  });

  it.each([
    ["text/plain (a cross-site form can send it)", { "Content-Type": "text/plain" }],
    ["a form encoding", { "Content-Type": "application/x-www-form-urlencoded", "Sec-Fetch-Site": "same-origin" }],
    ["no content type", {}],
    ["a JSON look-alike", { "Content-Type": "application/jsonp" }],
  ])("refuses %s with 415", (_label, headers) => {
    expect(checkMutationRequest(mutation(headers))).toEqual(UNSUPPORTED);
  });

  it("withGalleryAccess refuses a cross-site POST or DELETE before touching auth", async () => {
    for (const method of ["POST", "DELETE"]) {
      const run = vi.fn();
      const response = await withGalleryAccess(mutation({ ...JSON_CT, "Sec-Fetch-Site": "cross-site" }, method), ID, run);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ code: "forbidden" });
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(run).not.toHaveBeenCalled();
    }
    const wrongType = await withGalleryAccess(mutation({ "Content-Type": "text/plain" }), ID, vi.fn());
    expect(wrongType.status).toBe(415);
    expect(await wrongType.json()).toEqual({ code: "unsupported_media_type" });
    expect(getDriveAccess).not.toHaveBeenCalled();
  });

  it("withGalleryAccess does not apply the mutation guard to reads", async () => {
    vi.mocked(getDriveAccess).mockResolvedValue({ kind: "unauthenticated" });
    const read = new Request(URL_, { headers: { "Sec-Fetch-Site": "cross-site" } });
    expect((await withGalleryAccess(read, ID, vi.fn())).status).toBe(401);
  });
});

describe("cache headers", () => {
  const NO_STORE = "private, no-store";

  it.each([
    ["galleryErrorResponse", galleryErrorResponse(409, { code: "conflict", updatedAt: 5 })],
    ["galleryErrorResponse with extra headers", galleryErrorResponse(503, { code: "drive_unavailable" }, { "Retry-After": "7" })],
    ["a mapped Drive error", driveErrorToResponse(new DriveError(500, null, null))],
    ["galleryNotFoundResponse", galleryNotFoundResponse()],
    ["gallerySavedResponse", gallerySavedResponse(2000)],
    ["galleryTrashedResponse", galleryTrashedResponse()],
  ])("%s is private, no-store", (_label, response) => {
    expect(response.headers.get("Cache-Control")).toBe(NO_STORE);
  });

  it("keeps Retry-After next to Cache-Control on a 503", () => {
    const response = galleryErrorResponse(503, { code: "drive_unavailable" }, { "Retry-After": "7" });
    expect(response.headers.get("Retry-After")).toBe("7");
  });

  it("save and delete successes keep their status and body", async () => {
    const saved = gallerySavedResponse(2000);
    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({ updatedAt: 2000 });
    const trashed = galleryTrashedResponse();
    expect(trashed.status).toBe(204);
    expect(galleryNotFoundResponse().status).toBe(404);
  });
});

describe("preview responses", () => {
  const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  const preview = (overrides: Partial<IDrivePreview> = {}): IDrivePreview => ({
    fileId: "png-1",
    updatedAt: 2000,
    open: vi.fn(async () => new Blob([PNG_BYTES]).stream()),
    ...overrides,
  });
  const get = (headers: Record<string, string> = {}) => new Request(`${URL_}/preview?v=2000`, { headers });

  it("previewEtag is a strong, quoted tag that changes with the artwork version and the file", () => {
    const tag = previewEtag(ID, preview());
    expect(tag).toMatch(/^"[0-9a-f]{32}"$/);
    expect(previewEtag(ID, preview())).toBe(tag);
    expect(previewEtag(ID, preview({ updatedAt: 2001 }))).not.toBe(tag);
    expect(previewEtag(ID, preview({ updatedAt: null }))).not.toBe(tag);
    expect(previewEtag(ID, preview({ fileId: "png-2" }))).not.toBe(tag);
    expect(previewEtag("other-id", preview())).not.toBe(tag);
  });

  it("answers 200 with the PNG, its ETag and private, no-cache (no year-long immutable cache)", async () => {
    const response = await previewResponse(get(), ID, preview());
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("private, no-cache");
    expect(response.headers.get("ETag")).toBe(previewEtag(ID, preview()));
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG_BYTES);
  });

  it.each([
    ["the exact tag", (tag: string) => tag],
    ["a list containing the tag", (tag: string) => `"nope", ${tag}`],
    ["the weak form of the tag", (tag: string) => `W/${tag}`],
    ["*", () => "*"],
  ])("answers 304 without downloading when If-None-Match has %s", async (_label, header) => {
    const current = preview();
    const tag = previewEtag(ID, current);
    const response = await previewResponse(get({ "If-None-Match": header(tag) }), ID, current);
    expect(response.status).toBe(304);
    expect(response.headers.get("ETag")).toBe(tag);
    expect(response.headers.get("Cache-Control")).toBe("private, no-cache");
    expect(await response.text()).toBe("");
    expect(current.open).not.toHaveBeenCalled();
  });

  it("downloads again when If-None-Match holds an older tag", async () => {
    const old = previewEtag(ID, preview({ updatedAt: 1000 }));
    const response = await previewResponse(get({ "If-None-Match": old }), ID, preview());
    expect(response.status).toBe(200);
  });

  it.each([
    ["no preview file", null],
    ["a preview file that vanished before the download", preview({ open: async () => null })],
  ])("answers a private, no-store 404 for %s", async (_label, current) => {
    const response = await previewResponse(get(), ID, current);
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});

describe("request limits", () => {
  it("caps the inflated save body at 32 MiB by default", async () => {
    expect(MAX_INFLATED_BODY_BYTES).toBe(32 * 1024 * 1024);
    const request = await saveRequest({ pad: "0".repeat(MAX_INFLATED_BODY_BYTES) });
    expect(await readSaveRequest(request, ID)).toEqual(TOO_LARGE);
  });
});
