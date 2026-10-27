/**
 * Purpose:
 * Pure Google token handling for Auth.js: sign-in capture, access-token refresh and the
 * route-handler view of a decoded JWT cookie.
 *
 * Notes:
 * No env reads and no `server-only`: credentials and `fetch` come in through `IGoogleRefreshDeps`.
 * `refreshGoogleAccessToken` never throws. `resolveDriveAccess` refreshes in memory and persists
 * nothing; the cookie is rewritten by the jwt callback on `/api/auth/session`.
 */
import type {
  IGoogleRefreshDeps,
  IGoogleSignInAccount,
  IGoogleTokenState,
  TDriveAccess,
  TRefreshOutcome,
} from "../auth.type";

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const REFRESH_SKEW_MS = 60_000;

/** True from 60 s before the access token expires (`expiresAtSec` is epoch seconds). */
export function needsRefresh(expiresAtSec: number, nowMs: number): boolean {
  return nowMs >= expiresAtSec * 1000 - REFRESH_SKEW_MS;
}

/** Reads the Google token fields back from a decoded JWT; `null` when any is missing or malformed. */
export function readGoogleTokenState(token: Record<string, unknown>): IGoogleTokenState | null {
  const { accessToken, refreshToken, expiresAt } = token;
  if (
    typeof accessToken !== "string" ||
    accessToken === "" ||
    typeof refreshToken !== "string" ||
    refreshToken === "" ||
    typeof expiresAt !== "number" ||
    !Number.isFinite(expiresAt)
  ) {
    return null;
  }
  return { accessToken, refreshToken, expiresAt };
}

export async function refreshGoogleAccessToken(
  state: IGoogleTokenState,
  deps: IGoogleRefreshDeps,
): Promise<TRefreshOutcome> {
  try {
    const response = await deps.fetchFn(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: deps.clientId,
        client_secret: deps.clientSecret,
        grant_type: "refresh_token",
        refresh_token: state.refreshToken,
      }),
    });
    if (response.status === 400 || response.status === 401) {
      return { kind: "rejected" };
    }
    if (!response.ok) {
      return { kind: "unavailable" };
    }
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) {
      return { kind: "unavailable" };
    }
    const { access_token, expires_in, refresh_token } = body as Record<string, unknown>;
    if (typeof access_token !== "string" || typeof expires_in !== "number") {
      return { kind: "unavailable" };
    }
    return {
      kind: "refreshed",
      state: {
        accessToken: access_token,
        refreshToken: typeof refresh_token === "string" ? refresh_token : state.refreshToken,
        expiresAt: Math.floor(deps.nowMs / 1000) + expires_in,
      },
    };
  } catch {
    return { kind: "unavailable" };
  }
}

const REFRESH_FAILED = "RefreshFailed";

function signInToken<T extends Record<string, unknown>>(
  token: T,
  account: IGoogleSignInAccount,
): T {
  const { access_token, refresh_token, expires_at, scope } = account;
  if (
    !scope?.split(" ").includes(DRIVE_FILE_SCOPE) ||
    !access_token ||
    !refresh_token ||
    typeof expires_at !== "number"
  ) {
    return { ...token, error: REFRESH_FAILED };
  }
  return {
    ...token,
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt: expires_at,
  };
}

/** The Auth.js jwt callback body: stores tokens at sign-in, then keeps the access token fresh. */
export async function rotateGoogleToken<T extends Record<string, unknown>>(
  params: { token: T; account?: IGoogleSignInAccount | null },
  deps: IGoogleRefreshDeps,
): Promise<T> {
  const { token, account } = params;
  if (account) {
    return signInToken(token, account);
  }
  if (token.error === REFRESH_FAILED) {
    return token;
  }
  const state = readGoogleTokenState(token);
  if (!state) {
    return { ...token, error: REFRESH_FAILED };
  }
  if (!needsRefresh(state.expiresAt, deps.nowMs)) {
    return token;
  }
  const outcome = await refreshGoogleAccessToken(state, deps);
  if (outcome.kind === "refreshed") {
    return { ...token, ...outcome.state };
  }
  if (outcome.kind === "rejected") {
    return { ...token, error: REFRESH_FAILED };
  }
  return token;
}

/** Route-handler view of the decoded cookie (`null` = no session): a usable access token or why not. */
export async function resolveDriveAccess(
  token: Record<string, unknown> | null,
  deps: IGoogleRefreshDeps,
): Promise<TDriveAccess> {
  if (token === null) {
    return { kind: "unauthenticated" };
  }
  const state = token.error === REFRESH_FAILED ? null : readGoogleTokenState(token);
  if (!state) {
    return { kind: "reauth" };
  }
  if (!needsRefresh(state.expiresAt, deps.nowMs)) {
    return { kind: "ok", accessToken: state.accessToken };
  }
  const outcome = await refreshGoogleAccessToken(state, deps);
  if (outcome.kind === "refreshed") {
    return { kind: "ok", accessToken: outcome.state.accessToken };
  }
  return outcome.kind === "rejected" ? { kind: "reauth" } : { kind: "unavailable" };
}
