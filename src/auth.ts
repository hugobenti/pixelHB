/**
 * Purpose:
 * Auth.js configuration: Google sign-in with the Drive file scope and offline access, JWT sessions
 * and token rotation.
 *
 * Notes:
 * `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_REDIRECT_PROXY_URL` and
 * `AUTH_TRUST_HOST` are read by Auth.js itself. The session callback returns a token-free object,
 * and the jwt callback ignores `session` update payloads, so the client cannot write token fields.
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { DRIVE_FILE_SCOPE, rotateGoogleToken } from "@/features/shared/auth/logic/googleToken";
import { toPublicSession } from "@/features/shared/auth/logic/publicSession";
import { googleRefreshDeps } from "@/features/shared/auth/server/driveAccess";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
  session: { strategy: "jwt" },
  pages: { error: "/" },
  callbacks: {
    jwt: ({ token, account }) =>
      rotateGoogleToken({ token, account }, googleRefreshDeps(Date.now())),
    session: ({ session, token }) => toPublicSession(token, session.expires),
  },
});
