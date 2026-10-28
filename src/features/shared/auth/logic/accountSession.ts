/**
 * Purpose:
 * Pure decisions behind the account state: how one `/api/auth/session` answer is read, how it
 * moves the account state, and when a failed request is retried.
 *
 * Notes:
 * `next-auth/react` maps every failed request to `null`, the same value as "no session", which
 * signed the UI out whenever the network or the server hiccuped. Here only an explicit answer
 * (HTTP 200 without a user, or 404 because the auth route is off) means signed out. A failure
 * after a known state keeps it, so a transient error never ends a session, stops the sync engine
 * or drops an autosave. A failure with no known state yet is a guess, flagged `provisional`: the
 * last known owner (the account hint) when there is one, otherwise signed out, so a visitor is
 * never stuck in `loading` and the app stays usable offline.
 */
import type { IAccountHint, IAccountState, ISessionLike, TSessionFetchResult } from "../auth.type";
import { toAccountState } from "./publicSession";

export const SESSION_URL = "/api/auth/session";
export const FETCH_TIMEOUT_MS = 15_000;
/** The first request has no state to fall back on: a hanging endpoint must reach the provisional state soon. */
export const FIRST_FETCH_TIMEOUT_MS = 6000;
const RETRY_BASE_MS = 2000;
const RETRY_MAX_MS = 60_000;

export const LOADING_ACCOUNT: IAccountState = { status: "loading", user: null, needsReauth: false };

const PROVISIONAL_SIGNED_OUT: IAccountState = {
  status: "signedOut",
  user: null,
  needsReauth: false,
  provisional: true,
};

/** The state while the server cannot be asked: the hinted owner (no email), or signed out. */
function provisionalState(hint: IAccountHint | null): IAccountState {
  if (hint === null) return PROVISIONAL_SIGNED_OUT;
  return {
    status: "signedIn",
    user: { id: hint.id, name: hint.name, email: "", image: hint.image },
    needsReauth: false,
    provisional: true,
  };
}

/** Delay before retry number `failureCount` (1 = first retry): 2 s, 4 s, 8 s … capped at 60 s. */
export function retryDelayMs(failureCount: number): number {
  const exponent = Math.max(0, failureCount - 1);
  return Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** exponent);
}

/** Reads a parsed 200 body: `null` / no user = signed out; anything that is not a session = failed. */
export function classifySessionBody(body: unknown): TSessionFetchResult {
  if (body === null) return { kind: "signedOut" };
  if (typeof body !== "object" || Array.isArray(body)) return { kind: "failed" };
  const { user } = body as { user?: unknown };
  if (user === undefined || user === null) return { kind: "signedOut" };
  if (typeof user !== "object" || Array.isArray(user)) return { kind: "failed" };
  const { id } = user as { id?: unknown };
  if (typeof id !== "string" || id === "") return { kind: "signedOut" };
  return { kind: "signedIn", session: body as ISessionLike };
}

/** One session request; never throws. */
export async function fetchAccountSession(
  fetchFn: typeof fetch,
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<TSessionFetchResult> {
  try {
    const response = await fetchFn(SESSION_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
    });
    if (response.status === 404) return { kind: "signedOut" };
    if (!response.ok) return { kind: "failed" };
    return classifySessionBody(await response.json());
  } catch {
    return { kind: "failed" };
  }
}

function same(a: IAccountState, b: IAccountState): boolean {
  return (
    a.status === b.status &&
    a.needsReauth === b.needsReauth &&
    Boolean(a.provisional) === Boolean(b.provisional) &&
    a.user?.id === b.user?.id &&
    a.user?.name === b.user?.name &&
    a.user?.email === b.user?.email &&
    a.user?.image === b.user?.image
  );
}

/**
 * The account state after a request; returns `previous` itself when nothing changed. `hint` is the
 * last known signed-in owner, used only to guess when the very first request fails.
 */
export function nextAccountState(
  previous: IAccountState,
  result: TSessionFetchResult,
  hint: IAccountHint | null,
): IAccountState {
  if (result.kind === "failed") {
    return previous.status === "loading" ? provisionalState(hint) : previous;
  }
  const next = result.kind === "signedIn" ? toAccountState(result.session) : toAccountState(null);
  return same(previous, next) ? previous : next;
}
