/**
 * Purpose:
 * The account hint: id, name and image of the last signed-in account, so a first session request
 * that fails can still show the user their own drawings instead of guessing signed out.
 *
 * Notes:
 * No email and no token. The hint only says who was signed in last; it is never proof of a session
 * (see `provisional` on `IAccountState`).
 */
import type { IAccountHint, IAccountUser } from "../auth.type";
import { SESSION_MAX_AGE_SECONDS } from "../sessionLifetime";

const MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;
/** A hint saved "in the future" means the clock moved; it is not trusted. */
const CLOCK_SKEW_MS = 60_000;

export function toAccountHint(user: IAccountUser, nowMs: number): IAccountHint {
  return { id: user.id, name: user.name, image: user.image, savedAt: nowMs };
}

export function serializeAccountHint(hint: IAccountHint): string {
  return JSON.stringify({ id: hint.id, name: hint.name, image: hint.image, savedAt: hint.savedAt });
}

/**
 * `null` for anything that is not a stored hint with a non-empty id and a `savedAt` within the
 * session lifetime (7 days): an older hint describes a cookie that no longer exists.
 */
export function parseAccountHint(raw: string | null, nowMs: number): IAccountHint | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { id, name, image, savedAt } = parsed as Record<string, unknown>;
    if (typeof id !== "string" || id === "") return null;
    if (typeof savedAt !== "number" || !Number.isFinite(savedAt)) return null;
    if (nowMs - savedAt > MAX_AGE_MS || savedAt - nowMs > CLOCK_SKEW_MS) return null;
    return {
      id,
      name: typeof name === "string" ? name : "",
      image: typeof image === "string" ? image : null,
      savedAt,
    };
  } catch {
    return null;
  }
}
