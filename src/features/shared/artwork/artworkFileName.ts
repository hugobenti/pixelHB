/**
 * Purpose:
 * File names for exported artwork files.
 */
import type { TExportScale } from "./exportScale.type";

export function sanitizeFileNameSegment(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "artwork";
  }
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-");
}

export function exportFileName(title: string, scale: TExportScale): string {
  const base = sanitizeFileNameSegment(title);
  return scale === 1 ? `${base}.png` : `${base}@${scale}x.png`;
}
