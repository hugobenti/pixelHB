/**
 * Purpose:
 * Turns what Drive returned into data the engine can trust: a local artwork, or a PNG payload.
 */
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import { parseArtworkFile } from "@/features/shared/artwork/artworkFileFormat";

const PNG_PREFIX = "data:image/png;base64,";

/** Null when the file does not parse, has no v3 metadata, or is not the artwork that was requested. */
export function remoteFileToArtwork(file: unknown, expectedId: string): Omit<IArtwork, "thumbnail"> | null {
  const parsed = parseArtworkFile(file);
  if (!parsed || !parsed.meta || parsed.meta.id !== expectedId) return null;
  return { ...parsed.meta, ...parsed.data };
}

export function pngBase64FromDataUrl(dataUrl: string): string | null {
  if (!dataUrl.startsWith(PNG_PREFIX) || dataUrl.length === PNG_PREFIX.length) return null;
  return dataUrl.slice(PNG_PREFIX.length);
}
