/**
 * Purpose:
 * Durable "this owner's local copies still have to be wiped" note in localStorage, so a crash, a
 * closed tab or a failed wipe after sign-out is finished on the next start.
 *
 * Notes:
 * Holds only the owner id. Every call swallows storage errors (private mode, blocked storage): the
 * marker is a safety net, never a reason to fail.
 */
const KEY = "pixelhb.pendingWipe";

export function writePendingWipe(ownerId: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ownerId }));
  } catch {
    // Storage unavailable: no safety net, the sign-out still proceeds.
  }
}

export function readPendingWipe(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && "ownerId" in parsed) {
      return typeof parsed.ownerId === "string" && parsed.ownerId ? parsed.ownerId : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPendingWipe(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable.
  }
}
