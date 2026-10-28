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

export function toAccountHint(user: IAccountUser): IAccountHint {
  return { id: user.id, name: user.name, image: user.image };
}

export function serializeAccountHint(hint: IAccountHint): string {
  return JSON.stringify({ id: hint.id, name: hint.name, image: hint.image });
}

/** `null` for anything that is not a stored hint with a non-empty id. */
export function parseAccountHint(raw: string | null): IAccountHint | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { id, name, image } = parsed as Record<string, unknown>;
    if (typeof id !== "string" || id === "") return null;
    return {
      id,
      name: typeof name === "string" ? name : "",
      image: typeof image === "string" ? image : null,
    };
  } catch {
    return null;
  }
}
