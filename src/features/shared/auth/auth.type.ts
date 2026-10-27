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
  /** Google answered 400/401: the grant was revoked or is invalid. */
  | { kind: "rejected" }
  /** Network failure, 429/5xx or a malformed body: try again later. */
  | { kind: "unavailable" };

/** The part of Auth.js's `Account` the jwt callback reads (Auth.js `Account` is assignable). */
export interface IGoogleSignInAccount {
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

/** The shape `useSession().data` is read through. */
export interface ISessionLike {
  user?: { id?: string; name?: string | null; email?: string | null; image?: string | null };
  error?: string;
}

export type TSessionHookStatus = "loading" | "authenticated" | "unauthenticated";

export interface IAuthSessionProviderProps {
  children: ReactNode;
}

export type TDriveAccess =
  | { kind: "ok"; accessToken: string }
  | { kind: "unauthenticated" }
  /** Google refused the refresh (400/401) or no refresh token is available. */
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
}
