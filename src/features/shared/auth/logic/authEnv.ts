/**
 * Purpose:
 * The environment variables Google sign-in cannot work without, and the server log line that names
 * the missing ones.
 *
 * Notes:
 * Auth.js reports a missing `AUTH_SECRET` itself, but not a missing Google client id or secret (it
 * would send people to Google with an empty client id). The build never needs them.
 */

export const REQUIRED_AUTH_ENV = ["AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"] as const;

/** The required variables that are unset, empty or blank, in `REQUIRED_AUTH_ENV` order. */
export function missingAuthEnv(env: Readonly<Record<string, string | undefined>>): string[] {
  return REQUIRED_AUTH_ENV.filter((name) => !env[name]?.trim());
}

export function missingAuthEnvMessage(missing: readonly string[]): string {
  return `[auth] Google sign-in is not configured: missing ${missing.join(", ")}. Sign-in and Drive sync fail until it is set (README, "Production setup").`;
}
