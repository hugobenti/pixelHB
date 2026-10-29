import type { IArtworkFileV3 } from "@/features/shared/artwork/artworkFileService.type";
import type {
  IGalleryListItem,
  IGallerySaveRequest,
  IGallerySaveResponse,
} from "./galleryApi.type";

export type TApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; kind: "conflict"; updatedAt: number }
  | { ok: false; kind: "offline" }
  | { ok: false; kind: "unauthenticated" }
  | { ok: false; kind: "reauth" }
  | { ok: false; kind: "tooLarge" }
  /** The server refused a timestamp too far ahead of its clock: this device's clock is wrong. */
  | { ok: false; kind: "clockSkew" }
  | { ok: false; kind: "notFound" }
  | { ok: false; kind: "retry"; retryAfterMs: number }
  /** 400/502/unexpected/unparsable: push stays dirty and backs off; a pull `get` skips the item. */
  | { ok: false; kind: "failed"; status: number };

export interface IGalleryApiClient {
  list(): Promise<TApiResult<IGalleryListItem[]>>;
  get(id: string): Promise<TApiResult<IArtworkFileV3>>;
  /** Gzips the request; resolves `tooLarge` before any fetch when the body is over the cap. */
  save(request: IGallerySaveRequest): Promise<TApiResult<IGallerySaveResponse>>;
  remove(id: string, deletedAt: number): Promise<TApiResult<null>>;
}
