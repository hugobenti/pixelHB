/**
 * Purpose:
 * Server-side Google credentials and the Drive access token for route handlers.
 *
 * Notes:
 * `getToken` decodes the encrypted session cookie directly (no callbacks, no side effects); an
 * expiring access token is refreshed in memory only. The rotated token is persisted by the jwt
 * callback when the client polls `/api/auth/session`. A missing `AUTH_SECRET` makes `getToken`
 * throw `MissingSecret`: that is a configuration error and surfaces as a 500, not as signed out.
 * The tokens never leave the server.
 */
import "server-only";

import { getToken } from "next-auth/jwt";

import type { IGoogleRefreshDeps, TDriveAccess } from "../auth.type";
import { resolveDriveAccess } from "../logic/googleToken";

export function googleRefreshDeps(nowMs: number): IGoogleRefreshDeps {
  return {
    clientId: process.env.AUTH_GOOGLE_ID ?? "",
    clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    fetchFn: fetch,
    nowMs,
  };
}

export async function getDriveAccess(request: Request): Promise<TDriveAccess> {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: new URL(request.url).protocol === "https:",
  });
  return resolveDriveAccess(token, googleRefreshDeps(Date.now()));
}
