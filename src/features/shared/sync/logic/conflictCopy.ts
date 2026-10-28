/**
 * Purpose:
 * Decides when a pull must first keep the local version as its own artwork, and names that copy.
 *
 * Notes:
 * Only a row with work Drive does not have (not `synced`) and a strictly newer Drive copy loses
 * anything: on a tie the content is the same version. A title that already carries the suffix is not
 * suffixed again, so a conflict copy that conflicts later stays a plain "<title> (conflict copy)".
 * The title is cut (by code points, never mid-character) to fit `maxLength`, which is the Drive file
 * name limit, so the suffix survives in the Drive listing.
 */
import type { ILocalSyncFacts } from "./syncRules.type";

export function needsConflictCopy(local: ILocalSyncFacts, remoteUpdatedAt: number): boolean {
  return local.state !== "synced" && remoteUpdatedAt > local.updatedAt;
}

export function conflictCopyTitle(title: string, suffix: string, maxLength: number): string {
  const base = title.trim();
  if (base.endsWith(suffix.trim()) && base.length > suffix.trim().length) return base;
  const room = Math.max(0, maxLength - Array.from(suffix).length);
  const cut = Array.from(base).slice(0, room).join("").trimEnd();
  return cut.length > 0 ? `${cut}${suffix}` : suffix.trim();
}
