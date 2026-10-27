/**
 * Purpose:
 * Runtime constants and URL builders shared by the gallery API routes and their browser client.
 *
 * Notes:
 * Wire types live in `galleryApi.type.ts`. The body cap is for the gzip-compressed request
 * (Vercel limits a function request body to about 4.5 MB).
 */

export const MAX_SYNC_BODY_BYTES = 4_000_000;
export const ARTWORK_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function galleryArtworkUrl(id: string): string {
  return `/api/gallery/${encodeURIComponent(id)}`;
}

export function galleryPreviewUrl(id: string, updatedAt: number): string {
  return `${galleryArtworkUrl(id)}/preview?v=${updatedAt}`;
}
