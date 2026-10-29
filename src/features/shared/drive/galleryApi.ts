/**
 * Purpose:
 * Runtime constants and URL builders shared by the gallery API routes and their browser client.
 *
 * Notes:
 * Wire types live in `galleryApi.type.ts`. The body cap is for the gzip-compressed request
 * (Vercel limits a function request body to about 4.5 MB).
 */

export const MAX_SYNC_BODY_BYTES = 4_000_000;
/**
 * Cap on a save body after gunzip: a per-request memory bound (gzip bombs, one user exhausting a
 * function), not the format's theoretical maximum. That maximum is about 92 MB: 64 layers × 1000 ×
 * 1000 bytes as base64 (85.3 MB) + a 1000 × 1000 preview PNG as base64 (≤ 5.4 MB) + a reference
 * image (≤ 2 MB) + palette and names. With a full-size preview and reference image, 32 MiB still
 * holds a 1000 × 1000 canvas with about 19 layers (each layer is 1.33 MB as base64); a bigger
 * artwork is refused with 413 `too_large` and the client, which checks the same cap before sending,
 * marks it too large to sync (export keeps a copy).
 */
export const MAX_INFLATED_BODY_BYTES = 32 * 1024 * 1024;
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
