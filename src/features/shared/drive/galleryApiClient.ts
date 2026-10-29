/**
 * Purpose:
 * Browser client for the `/api/gallery` routes. Maps every outcome to a `TApiResult` so the sync
 * engine never inspects HTTP details.
 *
 * Notes:
 * `fetchFn` is always called as a plain function (never as a method of another object), otherwise
 * the browser throws "Illegal invocation". Artwork payloads are never logged. A `TypeError` from
 * `fetch` means the network is unreachable; any other thrown error is a bug and propagates.
 */
import type { IArtworkFileV3 } from "@/features/shared/artwork/artworkFileService.type";
import { galleryArtworkUrl, galleryStatusUrl, MAX_INFLATED_BODY_BYTES, MAX_SYNC_BODY_BYTES } from "./galleryApi";
import type {
  IGalleryErrorResponse,
  IGalleryListResponse,
  IGallerySaveRequest,
  IGallerySaveResponse,
  IGalleryStatusResponse,
} from "./galleryApi.type";
import type { IGalleryApiClient, TApiResult } from "./galleryApiClient.type";

const LIST_URL = "/api/gallery";
const DEFAULT_RETRY_AFTER_MS = 30_000;
const RETRY_AFTER_SECONDS = /^\d+$/;
const JSON_CONTENT_TYPE = "application/json";

function retryAfterMs(response: Response): number {
  const header = response.headers.get("Retry-After")?.trim() ?? "";
  return RETRY_AFTER_SECONDS.test(header) ? Number(header) * 1000 : DEFAULT_RETRY_AFTER_MS;
}

async function readErrorBody(response: Response): Promise<Partial<IGalleryErrorResponse>> {
  try {
    const body: unknown = await response.json();
    return body !== null && typeof body === "object" ? (body as Partial<IGalleryErrorResponse>) : {};
  } catch {
    return {};
  }
}

async function toFailure<T>(response: Response): Promise<TApiResult<T>> {
  switch (response.status) {
    case 401: {
      const body = await readErrorBody(response);
      return { ok: false, kind: body.code === "reauth" ? "reauth" : "unauthenticated" };
    }
    case 400: {
      const body = await readErrorBody(response);
      return body.code === "clock_skew"
        ? { ok: false, kind: "clockSkew" }
        : { ok: false, kind: "failed", status: response.status };
    }
    case 404:
      return { ok: false, kind: "notFound" };
    case 409: {
      const body = await readErrorBody(response);
      return typeof body.updatedAt === "number"
        ? { ok: false, kind: "conflict", updatedAt: body.updatedAt }
        : { ok: false, kind: "failed", status: response.status };
    }
    case 413:
      return { ok: false, kind: "tooLarge" };
    case 507:
      return { ok: false, kind: "driveFull" };
    case 429:
    case 503:
      return { ok: false, kind: "retry", retryAfterMs: retryAfterMs(response) };
    default:
      return { ok: false, kind: "failed", status: response.status };
  }
}

async function send<T>(
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit,
  readValue: (response: Response) => Promise<T>,
): Promise<TApiResult<T>> {
  let response: Response;
  try {
    response = await fetchFn(url, init);
  } catch (error) {
    if (error instanceof TypeError) {
      return { ok: false, kind: "offline" };
    }
    throw error;
  }
  if (!response.ok) {
    return toFailure<T>(response);
  }
  try {
    return { ok: true, value: await readValue(response) };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { ok: false, kind: "failed", status: response.status };
    }
    // The connection dropped while the body was streaming.
    if (error instanceof TypeError) {
      return { ok: false, kind: "offline" };
    }
    throw error;
  }
}

export function createGalleryApiClient(fetchFn: typeof fetch): IGalleryApiClient {
  return {
    list: () =>
      send(fetchFn, LIST_URL, { cache: "no-store" }, async (response) => {
        const body = (await response.json()) as Partial<IGalleryListResponse>;
        return {
          items: body.items ?? [],
          unreadableIds: body.unreadableIds ?? [],
          rootFolderTrashed: body.rootFolderTrashed === true,
        };
      }),

    get: (id) =>
      send(fetchFn, galleryArtworkUrl(id), { cache: "no-store" }, async (response) => {
        return (await response.json()) as IArtworkFileV3;
      }),

    status: (id) =>
      send(fetchFn, galleryStatusUrl(id), { cache: "no-store" }, async (response) => {
        return (await response.json()) as IGalleryStatusResponse;
      }),

    save: async (request: IGallerySaveRequest) => {
      // UTF-8 bytes, as the server counts them after gunzip.
      const json = new Blob([JSON.stringify(request)]);
      if (json.size > MAX_INFLATED_BODY_BYTES) {
        return { ok: false, kind: "tooLarge" };
      }
      const body = await new Response(json.stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
      if (body.byteLength > MAX_SYNC_BODY_BYTES) {
        return { ok: false, kind: "tooLarge" };
      }
      return send(
        fetchFn,
        galleryArtworkUrl(request.artwork.id),
        {
          method: "POST",
          headers: { "Content-Type": JSON_CONTENT_TYPE, "Content-Encoding": "gzip" },
          body,
        },
        async (response) => (await response.json()) as IGallerySaveResponse,
      );
    },

    remove: (id, deletedAt) =>
      send(
        fetchFn,
        galleryArtworkUrl(id),
        {
          method: "DELETE",
          headers: { "Content-Type": JSON_CONTENT_TYPE },
          body: JSON.stringify({ deletedAt }),
        },
        async () => null,
      ),
  };
}
