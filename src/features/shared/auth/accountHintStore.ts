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

export function readAccountHint(): IAccountHint | null {
  try {
    return parseAccountHint(localStorage.getItem(KEY));
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
