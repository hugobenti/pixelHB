import type { IArtworkFileV3 } from "@/features/shared/artwork/artworkFileService.type";

export interface IGalleryListItem {
  id: string;
  title: string;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
  /** `/api/gallery/${id}/preview?v=${updatedAt}` */
  previewUrl: string;
}

export interface IGalleryListResponse {
  items: IGalleryListItem[];
  /**
   * Ids of Drive files that carry the PixelHB marker but could not be read (another format version,
   * invalid properties). They exist, so the engine must never read their absence from `items` as a deletion.
   */
  unreadableIds: string[];
  /**
   * The PixelHB folder is in the Drive trash and no live one exists. Every file inside inherits
   * `trashed`, so a per-file trashed status then proves nothing about what the user meant.
   */
  rootFolderTrashed: boolean;
}

/** Where one artwork is in Drive: live, in the trash (only with a readable `updatedAt`), or nowhere. */
export type TGalleryArtworkState = "present" | "trashed" | "absent";

export interface IGalleryStatusResponse {
  state: TGalleryArtworkState;
  /** `updatedAt` of the live copy (`present`, when readable) or of the newest trashed copy (`trashed`). */
  updatedAt?: number;
}

export interface IGallerySaveRequest {
  artwork: IArtworkFileV3;
  /** Raw base64 PNG, no `data:` prefix. */
  previewPngBase64: string;
}

export interface IGallerySaveResponse {
  updatedAt: number;
}

export interface IGalleryDeleteRequest {
  deletedAt: number;
}

export type TGalleryErrorCode =
  | "unauthenticated"
  | "reauth"
  | "conflict"
  | "bad_request"
  | "clock_skew"
  | "too_large"
  | "drive_error"
  | "drive_unavailable";

export interface IGalleryErrorResponse {
  code: TGalleryErrorCode;
  updatedAt?: number;
}
