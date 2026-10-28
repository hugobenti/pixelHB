import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { serializeArtworkFile } from "@/features/shared/artwork/artworkFileFormat";
import { createGalleryApiClient } from "./galleryApiClient";
import { MAX_SYNC_BODY_BYTES } from "./galleryApi";

const ID = "3f1c9a52-0000-4000-8000-000000000001";
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const artwork = serializeArtworkFile({
  id: ID, title: "Sunset cat", width: 2, height: 2, createdAt: 1000, updatedAt: 2000,
  thumbnail: "", palette: ["#000000"], activeLayerId: "l1",
  layers: [{ id: "l1", name: "Layer 1", visible: true, pixelData: new Uint8Array(4) }],
});

function fetchReturning(response: Response | Error) {
  return vi.fn<typeof fetch>(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
}

describe("galleryApiClient", () => {
  it("save returns tooLarge without calling fetch when the gzipped body is over the cap", async () => {
    const fetchFn = fetchReturning(new Response(null, { status: 500 }));
    const previewPngBase64 = randomBytes(5_000_000).toString("base64"); // incompressible, gzip ≈ 5 MB
    const result = await createGalleryApiClient(fetchFn).save({ artwork, previewPngBase64 });
    expect(MAX_SYNC_BODY_BYTES).toBe(4_000_000);
    expect(result).toEqual({ ok: false, kind: "tooLarge" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("save POSTs a gzip body to /api/gallery/<id> and returns the confirmed updatedAt", async () => {
    const fetchFn = fetchReturning(Response.json({ updatedAt: 2000 }));
    const result = await createGalleryApiClient(fetchFn).save({ artwork, previewPngBase64: PNG_BASE64 });
    expect(result).toEqual({ ok: true, value: { updatedAt: 2000 } });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`/api/gallery/${ID}`);
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("Content-Encoding")).toBe("gzip");
    expect(headers.get("Content-Type")).toBe("application/json");
    const sent = await new Response(
      new Blob([init?.body as ArrayBuffer]).stream().pipeThrough(new DecompressionStream("gzip")),
    ).json();
    expect(sent).toEqual({ artwork, previewPngBase64: PNG_BASE64 });
  });

  it.each([
    ["network failure", new TypeError("Failed to fetch"), { ok: false, kind: "offline" }],
    ["401 reauth", Response.json({ code: "reauth" }, { status: 401 }), { ok: false, kind: "reauth" }],
    ["401 unauthenticated", Response.json({ code: "unauthenticated" }, { status: 401 }), { ok: false, kind: "unauthenticated" }],
    ["404", new Response(null, { status: 404 }), { ok: false, kind: "notFound" }],
    ["409", Response.json({ code: "conflict", updatedAt: 5000 }, { status: 409 }), { ok: false, kind: "conflict", updatedAt: 5000 }],
    ["413", Response.json({ code: "too_large" }, { status: 413 }), { ok: false, kind: "tooLarge" }],
    ["503 + Retry-After", Response.json({ code: "drive_unavailable" }, { status: 503, headers: { "Retry-After": "12" } }), { ok: false, kind: "retry", retryAfterMs: 12_000 }],
    ["503 without Retry-After", Response.json({ code: "drive_unavailable" }, { status: 503 }), { ok: false, kind: "retry", retryAfterMs: 30_000 }],
    ["429 with an HTTP-date Retry-After", new Response(null, { status: 429, headers: { "Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT" } }), { ok: false, kind: "retry", retryAfterMs: 30_000 }],
    ["502", Response.json({ code: "drive_error" }, { status: 502 }), { ok: false, kind: "failed", status: 502 }],
    ["507 drive_full", Response.json({ code: "drive_full" }, { status: 507 }), { ok: false, kind: "driveFull" }],
    ["400 clock_skew", Response.json({ code: "clock_skew" }, { status: 400 }), { ok: false, kind: "clockSkew" }],
    ["400 bad_request", Response.json({ code: "bad_request" }, { status: 400 }), { ok: false, kind: "failed", status: 400 }],
    ["400 with an unparsable body", new Response("<html>", { status: 400 }), { ok: false, kind: "failed", status: 400 }],
    ["200 with a non-JSON body", new Response("<html>", { status: 200 }), { ok: false, kind: "failed", status: 200 }],
  ])("get maps %s", async (_label, response, expected) => {
    const result = await createGalleryApiClient(fetchReturning(response)).get(ID);
    expect(result).toEqual(expected);
  });

  it("list returns the items and the unreadable ids", async () => {
    const item = { id: ID, title: "Sunset cat", width: 2, height: 2, createdAt: 1000, updatedAt: 2000, previewUrl: `/api/gallery/${ID}/preview?v=2000` };
    expect(await createGalleryApiClient(fetchReturning(Response.json({ items: [item], unreadableIds: ["x"] }))).list())
      .toEqual({ ok: true, value: { items: [item], unreadableIds: ["x"] } });
  });

  it("list treats a body without unreadableIds as having none", async () => {
    expect(await createGalleryApiClient(fetchReturning(Response.json({ items: [] }))).list())
      .toEqual({ ok: true, value: { items: [], unreadableIds: [] } });
  });

  it.each([
    ["present", { state: "present", updatedAt: 5 }],
    ["trashed", { state: "trashed", updatedAt: 9 }],
    ["absent", { state: "absent" }],
  ])("status GETs /api/gallery/<id>/status and returns %s", async (_label, body) => {
    const fetchFn = fetchReturning(Response.json(body));
    expect(await createGalleryApiClient(fetchFn).status(ID)).toEqual({ ok: true, value: body });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`/api/gallery/${ID}/status`);
    expect(init?.cache).toBe("no-store");
  });

  it("status maps failures like the other calls", async () => {
    expect(await createGalleryApiClient(fetchReturning(new TypeError("x"))).status(ID)).toEqual({ ok: false, kind: "offline" });
    expect(await createGalleryApiClient(fetchReturning(Response.json({ code: "reauth" }, { status: 401 }))).status(ID)).toEqual({ ok: false, kind: "reauth" });
  });

  it("list unwraps items; remove sends DELETE with deletedAt and maps 204 to ok null", async () => {
    const item = { id: ID, title: "Sunset cat", width: 2, height: 2, createdAt: 1000, updatedAt: 2000, previewUrl: `/api/gallery/${ID}/preview?v=2000` };
    expect(await createGalleryApiClient(fetchReturning(Response.json({ items: [item] }))).list())
      .toEqual({ ok: true, value: { items: [item], unreadableIds: [] } });

    const fetchFn = fetchReturning(new Response(null, { status: 204 }));
    expect(await createGalleryApiClient(fetchFn).remove(ID, 2500)).toEqual({ ok: true, value: null });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`/api/gallery/${ID}`);
    expect(init?.method).toBe("DELETE");
    expect(JSON.parse(String(init?.body))).toEqual({ deletedAt: 2500 });
  });

  it.each(["get", "list"] as const)("%s maps a body stream that errors mid-read to offline", async (method) => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new TypeError("network error"));
      },
    });
    const fetchFn = fetchReturning(new Response(body, { status: 200 }));
    const client = createGalleryApiClient(fetchFn);
    const result = method === "get" ? await client.get(ID) : await client.list();
    expect(result).toEqual({ ok: false, kind: "offline" });
  });
});
