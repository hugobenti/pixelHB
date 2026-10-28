import { describe, expect, it } from "vitest";

import { toAccountState, toPublicSession } from "./publicSession";

const EXPIRES = "2026-11-26T00:00:00.000Z";
const token = {
  sub: "google-sub-1",
  name: "Ada",
  email: "ada@example.com",
  picture: "https://lh3.googleusercontent.com/a/ada",
  accessToken: "ya29.secret-access",
  refreshToken: "1//secret-refresh",
  expiresAt: 1_700_003_600,
};

describe("toPublicSession", () => {
  it("exposes only id, name, email, image and expiry, never tokens", () => {
    const session = toPublicSession(token, EXPIRES);
    expect(session).toEqual({
      user: {
        id: "google-sub-1",
        name: "Ada",
        email: "ada@example.com",
        image: "https://lh3.googleusercontent.com/a/ada",
      },
      expires: EXPIRES,
    });
    expect(JSON.stringify(session)).not.toMatch(
      /secret|ya29|1\/\/|expiresAt|accessToken|refreshToken/,
    );
  });

  it("passes the RefreshFailed flag through and ignores any other error value", () => {
    expect(toPublicSession({ ...token, error: "RefreshFailed" }, EXPIRES).error).toBe(
      "RefreshFailed",
    );
    expect(toPublicSession({ ...token, error: "Something" }, EXPIRES)).not.toHaveProperty("error");
  });

  it("normalises missing profile fields", () => {
    expect(toPublicSession({ sub: "google-sub-1" }, EXPIRES).user).toEqual({
      id: "google-sub-1",
      name: "",
      email: "",
      image: null,
    });
  });
});

describe("toAccountState", () => {
  const session = toPublicSession(token, EXPIRES);
  it("maps a session with a user to signed in and no session to signed out", () => {
    expect(toAccountState(null)).toEqual({ status: "signedOut", user: null, needsReauth: false });
    expect(toAccountState(session)).toEqual({
      status: "signedIn",
      user: session.user,
      needsReauth: false,
    });
  });
  it("keeps the user signed in but asks for reauth on RefreshFailed", () => {
    expect(toAccountState({ ...session, error: "RefreshFailed" })).toEqual({
      status: "signedIn",
      user: session.user,
      needsReauth: true,
    });
  });
  it("treats a session without a user id as signed out", () => {
    expect(toAccountState({ user: { name: "Ada" } })).toEqual({
      status: "signedOut",
      user: null,
      needsReauth: false,
    });
  });
});
