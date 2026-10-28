/**
 * Purpose:
 * localStorage home of the account hint (see `logic/accountHint`).
 *
 * Notes:
 * Every call swallows storage errors (private mode, blocked storage): without storage there is no
 * hint, which only means a failed first session request reads as signed out.
 */
import type { IAccountHint } from "./auth.type";
import { parseAccountHint, serializeAccountHint } from "./logic/accountHint";

const KEY = "pixelhb.accountHint";

/** The stored hint, or `null`; an expired or unreadable one is removed. */
export function readAccountHint(): IAccountHint | null {
  try {
    const raw = localStorage.getItem(KEY);
    const hint = parseAccountHint(raw, Date.now());
    if (raw !== null && hint === null) localStorage.removeItem(KEY);
    return hint;
  } catch {
    return null;
  }
}

export function writeAccountHint(hint: IAccountHint): void {
  try {
    localStorage.setItem(KEY, serializeAccountHint(hint));
  } catch {
    // Storage unavailable: no hint next time.
  }
}

export function clearAccountHint(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable.
  }
}
