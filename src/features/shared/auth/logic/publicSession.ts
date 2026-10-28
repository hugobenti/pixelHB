/**
 * Purpose:
 * Shapes what the browser sees of the Auth.js session and maps the session body to the account state.
 *
 * Notes:
 * `toPublicSession` builds a fresh object from named fields and never spreads the token, so the
 * Google access and refresh tokens cannot reach `/api/auth/session` by accident.
 */
import type { IAccountState, IPublicSession, ISessionLike } from "../auth.type";

const text = (value: unknown): string => (typeof value === "string" ? value : "");

export function toPublicSession(token: Record<string, unknown>, expires: string): IPublicSession {
  const session: IPublicSession = {
    user: {
      id: text(token.sub),
      name: text(token.name),
      email: text(token.email),
      image: typeof token.picture === "string" ? token.picture : null,
    },
    expires,
  };
  if (token.error === "RefreshFailed") {
    session.error = "RefreshFailed";
  }
  return session;
}

/** Signed in when the session has a user id, otherwise signed out. */
export function toAccountState(session: ISessionLike | null): IAccountState {
  const user = session?.user;
  if (user?.id) {
    return {
      status: "signedIn",
      user: {
        id: user.id,
        name: text(user.name),
        email: text(user.email),
        image: user.image ?? null,
      },
      needsReauth: session?.error === "RefreshFailed",
    };
  }
  return { status: "signedOut", user: null, needsReauth: false };
}
