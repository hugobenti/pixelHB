/**
 * Purpose:
 * Runtime constants and URL builders shared by the gallery API routes and their browser client.
 *
 * Notes:
 * Wire types live in `galleryApi.type.ts`. The body cap is for the gzip-compressed request
 * (Vercel limits a function request body to about 4.5 MB).
 */

export const MAX_SYNC_BODY_BYTES = 4_000_000;
/** How far ahead of the server clock an `updatedAt` / `deletedAt` may be before the server refuses it. */
export const MAX_CLOCK_SKEW_MS = 5 * 60_000;
/** Longest Drive file base name; also the longest title that stays whole in the Drive listing. */
export const DRIVE_FILE_NAME_MAX = 100;
export const ARTWORK_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function galleryArtworkUrl(id: string): string {
  return `/api/gallery/${encodeURIComponent(id)}`;
}

export function galleryStatusUrl(id: string): string {
  return `${galleryArtworkUrl(id)}/status`;
}

export function galleryPreviewUrl(id: string, updatedAt: number): string {
  return `${galleryArtworkUrl(id)}/preview?v=${updatedAt}`;
}
