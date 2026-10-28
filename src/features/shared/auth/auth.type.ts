import type { ReactNode } from "react";

/** Google tokens kept in the encrypted Auth.js JWT cookie; `expiresAt` is epoch seconds. */
export interface IGoogleTokenState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface IGoogleRefreshDeps {
  clientId: string;
  clientSecret: string;
  fetchFn: typeof fetch;
  nowMs: number;
}

export type TRefreshOutcome =
  | { kind: "refreshed"; state: IGoogleTokenState }
  /** Google answered 400/401 with `invalid_grant` or `invalid_token`: the grant was revoked. */
  | { kind: "rejected" }
  /** Network failure, 429/5xx, any other 400/401 (e.g. `invalid_client`) or a malformed body: try again later. */
  | { kind: "unavailable" };

/** The part of Auth.js's `Account` the jwt callback reads (Auth.js `Account` is assignable). */
export interface IGoogleSignInAccount {
  /** The Google account id (`sub` of the id token): the stable owner id. */
  providerAccountId?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
}

/** What the browser may see of the session: never any token. */
export interface IPublicSession {
  user: { id: string; name: string; email: string; image: string | null };
  expires: string;
  error?: "RefreshFailed";
}

/** The shape of the `/api/auth/session` body that the account state is read from. */
export interface ISessionLike {
  user?: { id?: string; name?: string | null; email?: string | null; image?: string | null };
  error?: string;
}

export interface IAuthSessionProviderProps {
  children: ReactNode;
}

export type TDriveAccess =
  | { kind: "ok"; accessToken: string }
  | { kind: "unauthenticated" }
  /** Google reported the grant revoked (`invalid_grant`) or no refresh token is available. */
  | { kind: "reauth" }
  /** Google's token endpoint is unreachable, rate limited or failing. */
  | { kind: "unavailable" };

export interface IAccountUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export type TAccountStatus = "disabled" | "loading" | "signedOut" | "signedIn";

export interface IAccountState {
  status: TAccountStatus;
  user: IAccountUser | null;
  needsReauth: boolean;
  /**
   * A guess made because the first session request failed (offline, 5xx, timeout): `signedIn` as
   * the last known owner, or `signedOut` without one. Never act destructively on it: no wipe, no
   * sign-out, no engine. The next answer from the server replaces it.
   */
  provisional?: boolean;
}

/** The non-secret part of the last signed-in account, kept in localStorage to survive a failed first request. */
export interface IAccountHint {
  id: string;
  name: string;
  image: string | null;
}

/** What one `/api/auth/session` request told us. `signedIn` and `signedOut` are answers from the server. */
export type TSessionFetchResult =
  | { kind: "signedIn"; session: ISessionLike }
  /** HTTP 200 whose body is `null`, `{}` or has no user id, or HTTP 404 (the auth route is off). */
  | { kind: "signedOut" }
  /** Network error, timeout, non-2xx status or a body that is not a session: no information. */
  | { kind: "failed" };
