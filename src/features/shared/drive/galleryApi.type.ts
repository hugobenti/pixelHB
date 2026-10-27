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
  | "too_large"
  | "drive_error"
  | "drive_unavailable";

export interface IGalleryErrorResponse {
  code: TGalleryErrorCode;
  updatedAt?: number;
}
