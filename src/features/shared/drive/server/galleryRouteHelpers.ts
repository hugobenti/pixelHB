/**
 * Purpose:
 * Shared plumbing for the `/api/gallery` route handlers: id gate, the CSRF guard on
 * state-changing requests, Drive access, request body reading with size caps, cache headers, the
 * preview's ETag revalidation and the mapping of Drive failures to the gallery error codes.
 *
 * Notes:
 * Every route starts in `withGalleryAccess`: a malformed id answers 400 and a POST/DELETE that
 * fails `checkMutationRequest` answers 403/415, both before auth is touched;
 * missing/expired Google access answers 401/503. The Drive access token is only handed to the store;
 * it is never logged or returned. Request bodies and artwork payloads are never logged. A non-Drive
 * exception rethrows (a 500 is a bug, not a Drive state). Every response except the preview is
 * `private, no-store`; the preview is `private, no-cache` with a strong ETag.
 */
import { createHash } from "node:crypto";
import { parseArtworkFile, serializeArtworkFile } from "@/features/shared/artwork/artworkFileFormat";
import { getDriveAccess } from "@/features/shared/auth/server/driveAccess";
import {
  ARTWORK_ID_PATTERN,
  MAX_CLOCK_SKEW_MS,
  MAX_INFLATED_BODY_BYTES,
  MAX_SYNC_BODY_BYTES,
} from "../galleryApi";
import type { IGalleryErrorResponse, IGallerySaveResponse } from "../galleryApi.type";
import { createDriveArtworkStore } from "./driveArtworkStore";
import type { IDriveArtworkStore, IDrivePreview } from "./driveArtworkStore.type";
import { DriveError } from "./driveRest";
import type {
  ISaveBodyLimits,
  TCappedBytes,
  TDeleteRequestResult,
  TRequestRejection,
  TSaveRequestResult,
} from "./galleryRouteHelpers.type";

export const DEFAULT_RETRY_AFTER_SECONDS = "30";
const MAX_DELETE_BODY_BYTES = 1024;
const DEFAULT_LIMITS: ISaveBodyLimits = {
  maxCompressedBytes: MAX_SYNC_BODY_BYTES,
  maxInflatedBytes: MAX_INFLATED_BODY_BYTES,
};
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RATE_LIMIT_REASONS = new Set(["rateLimitExceeded", "userRateLimitExceeded"]);
const DRIVE_FULL_REASON = "storageQuotaExceeded";
const HTTP_INSUFFICIENT_STORAGE = 507;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR = 500;
const NO_STORE = { "Cache-Control": "private, no-store" };
/** Cached by the browser but revalidated on every use, so a preview never outlives a sign-out. */
const PREVIEW_CACHE_CONTROL = "private, no-cache";
const ETAG_HEX_LENGTH = 32;
const JSON_MEDIA_TYPE = "application/json";

const BAD_REQUEST: TRequestRejection = { ok: false, status: 400, code: "bad_request" };
const TOO_LARGE: TRequestRejection = { ok: false, status: 413, code: "too_large" };
const CLOCK_SKEW: TRequestRejection = { ok: false, status: 400, code: "clock_skew" };
const FORBIDDEN: TRequestRejection = { ok: false, status: 403, code: "forbidden" };
const UNSUPPORTED_MEDIA_TYPE: TRequestRejection = { ok: false, status: 415, code: "unsupported_media_type" };

export function galleryErrorResponse(
  status: number,
  body: IGalleryErrorResponse,
  headers?: HeadersInit,
): Response {
  const merged = new Headers(headers);
  merged.set("Cache-Control", NO_STORE["Cache-Control"]);
  return Response.json(body, { status, headers: merged });
}

/** Bare 404: the artwork (or its preview) is not in Drive. */
export function galleryNotFoundResponse(): Response {
  return new Response(null, { status: 404, headers: NO_STORE });
}

export function gallerySavedResponse(updatedAt: number): Response {
  return Response.json({ updatedAt } satisfies IGallerySaveResponse, { headers: NO_STORE });
}

export function galleryTrashedResponse(): Response {
  return new Response(null, { status: 204, headers: NO_STORE });
}

/** Host the browser addressed: `X-Forwarded-Host` behind a proxy (Vercel), else `Host`, else the URL's. */
function requestHost(request: Request): string {
  const forwarded = request.headers.get("X-Forwarded-Host")?.split(",")[0].trim();
  return forwarded || request.headers.get("Host") || new URL(request.url).host;
}

function originHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

/**
 * CSRF defence in depth for POST/DELETE (the session cookie is already SameSite=Lax). A browser
 * request must come from this origin: `Sec-Fetch-Site` other than `same-origin` (cross-site, a sibling
 * `same-site` subdomain, or `none`) and an `Origin` whose host is not the one the request was sent to
 * (compared like Next's Server Actions check: `X-Forwarded-Host`, else `Host`) are refused with 403.
 * A client that sends neither header (not a browser) is let through. The body must be declared
 * `application/json` (415 otherwise), which a cross-site form or a no-CORS fetch cannot send.
 */
export function checkMutationRequest(request: Request): TRequestRejection | null {
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite !== null && fetchSite !== "same-origin") {
    return FORBIDDEN;
  }
  const origin = request.headers.get("Origin");
  if (origin !== null && originHost(origin) !== requestHost(request)) {
    return FORBIDDEN;
  }
  const mediaType = request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
  return mediaType === JSON_MEDIA_TYPE ? null : UNSUPPORTED_MEDIA_TYPE;
}

export function driveErrorToResponse(error: DriveError): Response {
  if (error.status === HTTP_UNAUTHORIZED) {
    return galleryErrorResponse(401, { code: "reauth" });
  }
  if (error.status === HTTP_FORBIDDEN && error.reason === DRIVE_FULL_REASON) {
    return galleryErrorResponse(HTTP_INSUFFICIENT_STORAGE, { code: "drive_full" });
  }
  const unavailable =
    error.status === 0 ||
    error.status === HTTP_TOO_MANY_REQUESTS ||
    error.status >= HTTP_SERVER_ERROR ||
    (error.status === HTTP_FORBIDDEN && error.reason !== null && RATE_LIMIT_REASONS.has(error.reason));
  if (unavailable) {
    return galleryErrorResponse(
      503,
      { code: "drive_unavailable" },
      { "Retry-After": error.retryAfter ?? DEFAULT_RETRY_AFTER_SECONDS },
    );
  }
  return galleryErrorResponse(502, { code: "drive_error" });
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** Reads a stream chunk by chunk; cancels it and returns `null` as soon as `maxBytes` is exceeded. */
async function readCapped(stream: ReadableStream<Uint8Array>, maxBytes: number): Promise<TCappedBytes> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      const bytes = concat(chunks, total);
      chunks.length = 0;
      return bytes;
    }
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
}

function declaredLength(request: Request): number {
  const header = request.headers.get("Content-Length");
  return header === null ? Number.NaN : Number(header);
}

async function readBodyBytes(request: Request, maxBytes: number): Promise<TCappedBytes> {
  if (declaredLength(request) > maxBytes) {
    return null;
  }
  return request.body ? readCapped(request.body, maxBytes) : new Uint8Array(0);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodePng(base64: string): Uint8Array | null {
  if (!BASE64_PATTERN.test(base64)) {
    return null;
  }
  const bytes = new Uint8Array(Buffer.from(base64, "base64"));
  return bytes.byteLength >= PNG_SIGNATURE.length && PNG_SIGNATURE.every((byte, i) => bytes[i] === byte)
    ? bytes
    : null;
}

/** A stamp ahead of the server clock by more than the tolerance would freeze the artwork on every device. */
function isTooFarAhead(stamp: number, nowMs: number): boolean {
  return stamp > nowMs + MAX_CLOCK_SKEW_MS;
}

function parseSaveBody(body: unknown, id: string, nowMs: number): TSaveRequestResult {
  if (!isPlainObject(body) || !isPlainObject(body.artwork) || typeof body.previewPngBase64 !== "string") {
    return BAD_REQUEST;
  }
  const { artwork, previewPngBase64 } = body;
  if (artwork.version !== 3) {
    return BAD_REQUEST;
  }
  const parsed = parseArtworkFile(artwork);
  if (!parsed || !parsed.meta || parsed.meta.id !== id) {
    return BAD_REQUEST;
  }
  const { meta, data } = parsed;
  if (!Number.isSafeInteger(meta.createdAt) || !Number.isSafeInteger(meta.updatedAt)) {
    return BAD_REQUEST;
  }
  if (isTooFarAhead(meta.updatedAt, nowMs)) {
    return CLOCK_SKEW;
  }
  const previewPng = decodePng(previewPngBase64);
  if (!previewPng) {
    return BAD_REQUEST;
  }
  return {
    ok: true,
    upsert: {
      id,
      title: data.title,
      width: data.width,
      height: data.height,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      // Rebuilt from the validated fields so unknown client keys never reach the user's Drive.
      artworkJson: JSON.stringify(serializeArtworkFile({ ...data, id, createdAt: meta.createdAt, updatedAt: meta.updatedAt, thumbnail: "" })),
      previewPng,
    },
  };
}

export async function readSaveRequest(
  request: Request,
  id: string,
  limits: ISaveBodyLimits = DEFAULT_LIMITS,
  nowMs: number = Date.now(),
): Promise<TSaveRequestResult> {
  try {
    const compressed = await readBodyBytes(request, limits.maxCompressedBytes);
    if (compressed === null) {
      return TOO_LARGE;
    }
    let bytes: TCappedBytes = compressed;
    if (request.headers.get("Content-Encoding")?.trim().toLowerCase() === "gzip") {
      const inflating = new Blob([compressed as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
      bytes = await readCapped(inflating, limits.maxInflatedBytes);
      if (bytes === null) {
        return TOO_LARGE;
      }
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return parseSaveBody(JSON.parse(text), id, nowMs);
  } catch {
    return BAD_REQUEST;
  }
}

export async function readDeleteRequest(request: Request, nowMs: number = Date.now()): Promise<TDeleteRequestResult> {
  try {
    const bytes = await readBodyBytes(request, MAX_DELETE_BODY_BYTES);
    if (bytes === null) {
      return TOO_LARGE;
    }
    const body: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!isPlainObject(body)) {
      return BAD_REQUEST;
    }
    const { deletedAt } = body;
    if (typeof deletedAt !== "number" || !Number.isSafeInteger(deletedAt) || deletedAt < 0) {
      return BAD_REQUEST;
    }
    return isTooFarAhead(deletedAt, nowMs) ? CLOCK_SKEW : { ok: true, deletedAt };
  } catch {
    return BAD_REQUEST;
  }
}

export async function withGalleryAccess(
  request: Request,
  id: string | null,
  run: (store: IDriveArtworkStore) => Promise<Response>,
): Promise<Response> {
  if (id !== null && !ARTWORK_ID_PATTERN.test(id)) {
    return galleryErrorResponse(400, { code: "bad_request" });
  }
  const reads = request.method === "GET" || request.method === "HEAD";
  const rejection = reads ? null : checkMutationRequest(request);
  if (rejection) {
    return galleryErrorResponse(rejection.status, { code: rejection.code });
  }
  const access = await getDriveAccess(request);
  switch (access.kind) {
    case "unauthenticated":
      return galleryErrorResponse(401, { code: "unauthenticated" });
    case "reauth":
      return galleryErrorResponse(401, { code: "reauth" });
    case "unavailable":
      return galleryErrorResponse(
        503,
        { code: "drive_unavailable" },
        { "Retry-After": DEFAULT_RETRY_AFTER_SECONDS },
      );
    case "ok":
      break;
  }
  try {
    return await run(createDriveArtworkStore({ accessToken: access.accessToken, fetchFn: fetch }));
  } catch (error) {
    if (error instanceof DriveError) {
      return driveErrorToResponse(error);
    }
    throw error;
  }
}

/**
 * Strong ETag of a preview: a hash of the artwork id, the artwork's `updatedAt` and the PNG's Drive
 * file id, so it changes whenever a save rewrites the preview (the JSON stamp moves on every save).
 */
export function previewEtag(id: string, preview: IDrivePreview): string {
  const hash = createHash("sha256").update(`${id}:${preview.updatedAt ?? ""}:${preview.fileId}`).digest("hex");
  return `"${hash.slice(0, ETAG_HEX_LENGTH)}"`;
}

/** `If-None-Match` uses the weak comparison: `W/"x"` matches `"x"`; `*` matches any tag. */
function matchesIfNoneMatch(header: string | null, etag: string): boolean {
  if (header === null) {
    return false;
  }
  return header
    .split(",")
    .map((tag) => tag.trim().replace(/^W\//, ""))
    .some((tag) => tag === "*" || tag === etag);
}

/** 304 when the browser already holds this version (no download from Drive), else the PNG. */
export async function previewResponse(
  request: Request,
  id: string,
  preview: IDrivePreview | null,
): Promise<Response> {
  if (!preview) {
    return galleryNotFoundResponse();
  }
  const etag = previewEtag(id, preview);
  const cacheHeaders = { ETag: etag, "Cache-Control": PREVIEW_CACHE_CONTROL };
  if (matchesIfNoneMatch(request.headers.get("If-None-Match"), etag)) {
    return new Response(null, { status: 304, headers: cacheHeaders });
  }
  const stream = await preview.open();
  return stream === null
    ? galleryNotFoundResponse()
    : new Response(stream, { headers: { ...cacheHeaders, "Content-Type": "image/png" } });
}
