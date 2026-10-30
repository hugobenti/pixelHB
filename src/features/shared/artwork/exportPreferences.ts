/**
 * Purpose:
 * Parse the remembered PNG export preferences read from localStorage.
 */
import { EXPORT_SCALES } from "./exportScale";
import type { TExportScale } from "./exportScale.type";

export const EXPORT_SCALE_KEY = "pixelhb.exportScale";

export function parseExportScale(raw: string | null): TExportScale | null {
  if (raw === null) {
    return null;
  }
  return EXPORT_SCALES.find((scale) => String(scale) === raw) ?? null;
}
