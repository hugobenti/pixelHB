/**
 * Purpose:
 * Auth.js configuration: Google sign-in with the Drive file scope and offline access, JWT sessions
 * and token rotation.
 *
 * Notes:
 * `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_REDIRECT_PROXY_URL` and
 * `AUTH_TRUST_HOST` are read by Auth.js itself. The session callback returns a token-free object,
 * and the jwt callback ignores `session` update payloads, so the client cannot write token fields.
 * Sign-out revokes the Google grant (best effort, never blocks or fails the sign-out).
 * The config is built per request (lazy), so the check below runs at the first request of a
 * production server, never during `next build`, which needs none of the variables. Missing ones
 * are logged by name; Auth.js then answers its own configuration error (missing secret) on
 * `/api/auth/*` and the signed-out app keeps working.
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { missingAuthEnv, missingAuthEnvMessage } from "@/features/shared/auth/logic/authEnv";
import {
  DRIVE_FILE_SCOPE,
  revokeGoogleToken,
  rotateGoogleToken,
} from "@/features/shared/auth/logic/googleToken";
import { SESSION_MAX_AGE_SECONDS } from "@/features/shared/auth/sessionLifetime";
import { toPublicSession } from "@/features/shared/auth/logic/publicSession";
import { googleRefreshDeps } from "@/features/shared/auth/server/driveAccess";

let authEnvChecked = false;

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  if (!authEnvChecked && process.env.NODE_ENV === "production") {
    authEnvChecked = true;
    const missing = missingAuthEnv(process.env);
    if (missing.length > 0) console.error(missingAuthEnvMessage(missing));
  }
  return {
    providers: [
      Google({
        authorization: {
          params: {
            scope: `openid email profile ${DRIVE_FILE_SCOPE}`,
            access_type: "offline",
            prompt: "consent",
            response_type: "code",
          },
        },
      }),
    ],
    session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
    pages: { error: "/" },
    callbacks: {
      jwt: ({ token, account }) =>
        rotateGoogleToken({ token, account }, googleRefreshDeps(Date.now())),
      session: ({ session, token }) => toPublicSession(token, session.expires),
    },
    events: {
      signOut: async (message) => {
        if ("token" in message) await revokeGoogleToken(message.token, fetch);
      },
    },
  };
});
