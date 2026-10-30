/**
 * Purpose:
 * Parse the remembered PNG export preferences read from localStorage.
 */
import { EXPORT_SCALES } from "./exportScale";
import type { IExportStorage, TExportScale } from "./exportScale.type";

export const EXPORT_SCALE_KEY = "pixelhb.exportScale";
export const EXPORT_CREDIT_KEY = "pixelhb.exportCredit";

export function parseExportScale(raw: string | null): TExportScale | null {
  if (raw === null) {
    return null;
  }
  return EXPORT_SCALES.find((scale) => String(scale) === raw) ?? null;
}

/** Reads the remembered scale; a storage error reads as "nothing stored". */
export function readStoredExportScale(getStorage: () => IExportStorage): TExportScale | null {
  try {
    return parseExportScale(getStorage().getItem(EXPORT_SCALE_KEY));
  } catch {
    return null;
  }
}

/** Remembers the scale; a storage error is swallowed (the choice just isn't kept). */
export function writeStoredExportScale(
  getStorage: () => IExportStorage,
  scale: TExportScale,
): void {
  try {
    getStorage().setItem(EXPORT_SCALE_KEY, String(scale));
  } catch {
    // Storage unavailable.
  }
}

/** The credit strip is on unless the stored value is exactly "off". */
export function parseExportCredit(raw: string | null): boolean {
  return raw !== "off";
}

/** Reads the remembered credit choice; a storage error reads as the default (on). */
export function readStoredExportCredit(getStorage: () => IExportStorage): boolean {
  try {
    return parseExportCredit(getStorage().getItem(EXPORT_CREDIT_KEY));
  } catch {
    return true;
  }
}

/** Remembers the credit choice; a storage error is swallowed (the choice just isn't kept). */
export function writeStoredExportCredit(getStorage: () => IExportStorage, credit: boolean): void {
  try {
    getStorage().setItem(EXPORT_CREDIT_KEY, credit ? "on" : "off");
  } catch {
    // Storage unavailable.
  }
}
