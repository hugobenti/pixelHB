/**
 * Purpose:
 * Tells whether an Auth.js `signOut({ redirect: false })` call really ended the session.
 *
 * Notes:
 * next-auth resolves that call without checking the HTTP status: a CSRF or configuration error comes
 * back as `{ url: ".../error?error=..." }`, and a failed request can resolve to `undefined`.
 * Only a `{ url }` that does not point at the error page counts as signed out.
 */
export function verifySignOutResult(result: unknown): "ok" | "failed" {
  if (typeof result !== "object" || result === null || !("url" in result)) return "failed";
  const { url } = result;
  if (typeof url !== "string") return "failed";
  try {
    const { pathname } = new URL(url, "http://localhost");
    return pathname.replace(/\/+$/, "").endsWith("/error") ? "failed" : "ok";
  } catch {
    return "failed";
  }
}
