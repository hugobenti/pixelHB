import { describe, expect, it, vi } from "vitest";

import type { IGoogleRefreshDeps, IGoogleTokenState } from "../auth.type";
import {
  needsRefresh,
  refreshGoogleAccessToken,
  resolveDriveAccess,
  revokeGoogleToken,
  rotateGoogleToken,
} from "./googleToken";

const NOW_MS = 1_700_000_000_000;
const NOW_SEC = 1_700_000_000;
const DRIVE = "https://www.googleapis.com/auth/drive.file";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
function fakeFetch(result: Response | Error) {
  const fetchFn = vi.fn<typeof fetch>();
  if (result instanceof Error) fetchFn.mockRejectedValue(result);
  else fetchFn.mockResolvedValue(result);
  return fetchFn;
}
const depsWith = (fetchFn: typeof fetch): IGoogleRefreshDeps => ({
  clientId: "client-id",
  clientSecret: "client-secret",
  fetchFn,
  nowMs: NOW_MS,
});
const state: IGoogleTokenState = {
  accessToken: "a1",
  refreshToken: "r1",
  expiresAt: NOW_SEC + 30,
};
const base = {
  sub: "google-sub-1",
  name: "Ada",
  email: "ada@example.com",
  picture: "https://lh3.googleusercontent.com/a/ada",
};
/** Shape of the `Account` Auth.js passes to the jwt callback at sign-in. */
const account = {
  provider: "google",
  type: "oidc",
  providerAccountId: "google-sub-1",
  access_token: "a1",
  refresh_token: "r1",
  expires_at: NOW_SEC + 3600,
  token_type: "bearer",
  id_token: "header.payload.signature",
  scope: `openid email profile ${DRIVE}`,
};
/** Auth.js puts a fresh random UUID in `token.sub` at every sign-in (`@auth/core` callback.js). */
const randomSub = () => crypto.randomUUID();

describe("needsRefresh", () => {
  it("is false until 60 s before expiry and true from then on", () => {
    expect(needsRefresh(1_000, 939_999)).toBe(false);
    expect(needsRefresh(1_000, 940_000)).toBe(true);
    expect(needsRefresh(1_000, 1_000_001)).toBe(true);
  });
});

describe("refreshGoogleAccessToken", () => {
  it("passes a timeout signal so a hung token endpoint resolves as unavailable", async () => {
    const fetchFn = fakeFetch(new DOMException("The operation timed out.", "TimeoutError"));
    await expect(refreshGoogleAccessToken(state, depsWith(fetchFn))).resolves.toEqual({
      kind: "unavailable",
    });
    expect(fetchFn.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("posts the refresh grant and keeps the old refresh token when Google sends none", async () => {
    const fetchFn = fakeFetch(
      json(200, { access_token: "a2", expires_in: 3599, token_type: "Bearer", scope: DRIVE }),
    );
    await expect(refreshGoogleAccessToken(state, depsWith(fetchFn))).resolves.toEqual({
      kind: "refreshed",
      state: { accessToken: "a2", refreshToken: "r1", expiresAt: NOW_SEC + 3599 },
    });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    expect(init?.method).toBe("POST");
    expect(Object.fromEntries(new URLSearchParams(String(init?.body)))).toEqual({
      client_id: "client-id",
      client_secret: "client-secret",
      grant_type: "refresh_token",
      refresh_token: "r1",
    });
  });

  it("adopts a new refresh token when Google returns one", async () => {
    const fetchFn = fakeFetch(
      json(200, { access_token: "a2", expires_in: 3599, refresh_token: "r2" }),
    );
    const outcome = await refreshGoogleAccessToken(state, depsWith(fetchFn));
    expect(outcome).toEqual({
      kind: "refreshed",
      state: { accessToken: "a2", refreshToken: "r2", expiresAt: NOW_SEC + 3599 },
    });
  });

  it("reports rejected only when Google says the grant is invalid (invalid_grant, invalid_token)", async () => {
    for (const [status, error] of [
      [400, "invalid_grant"],
      [401, "invalid_grant"],
      [400, "invalid_token"],
      [401, "invalid_token"],
    ] as const) {
      const fetchFn = fakeFetch(json(status, { error }));
      await expect(refreshGoogleAccessToken(state, depsWith(fetchFn))).resolves.toEqual({
        kind: "rejected",
      });
    }
  });

  it("reports unavailable for other 400/401 answers (rotated secret, malformed request, bad body)", async () => {
    for (const result of [
      json(401, { error: "invalid_client" }),
      json(400, { error: "invalid_request" }),
      json(400, { error: "unsupported_grant_type" }),
      json(400, {}),
      json(400, null),
      new Response("<html>Bad Request</html>", { status: 400 }),
      new Response("", { status: 401 }),
    ]) {
      await expect(refreshGoogleAccessToken(state, depsWith(fakeFetch(result)))).resolves.toEqual({
        kind: "unavailable",
      });
    }
  });

  it("reports unavailable for 429, 5xx, a network failure or a malformed body, and never throws", async () => {
    for (const result of [
      json(429, {}),
      json(503, {}),
      new TypeError("fetch failed"),
      json(200, { token_type: "Bearer" }),
    ]) {
      await expect(refreshGoogleAccessToken(state, depsWith(fakeFetch(result)))).resolves.toEqual({
        kind: "unavailable",
      });
    }
  });
});

describe("rotateGoogleToken (jwt callback)", () => {
  it("stores Google tokens at sign-in without calling Google", async () => {
    const fetchFn = fakeFetch(new Error("unused"));
    await expect(
      rotateGoogleToken({ token: { ...base, sub: randomSub() }, account }, depsWith(fetchFn)),
    ).resolves.toEqual({
      ...base,
      accessToken: "a1",
      refreshToken: "r1",
      expiresAt: NOW_SEC + 3600,
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("sets sub to the Google account id, replacing the random id Auth.js generated", async () => {
    const deps = depsWith(fakeFetch(new Error("unused")));
    const next = await rotateGoogleToken({ token: { ...base, sub: randomSub() }, account }, deps);
    expect(next.sub).toBe("google-sub-1");
  });

  it("gives two sign-ins of the same Google account the same sub, whatever Auth.js generated", async () => {
    const deps = depsWith(fakeFetch(new Error("unused")));
    const first = await rotateGoogleToken({ token: { ...base, sub: randomSub() }, account }, deps);
    const second = await rotateGoogleToken({ token: { ...base, sub: randomSub() }, account }, deps);
    expect(first.sub).toBe(second.sub);
    const other = await rotateGoogleToken(
      {
        token: { ...base, sub: randomSub() },
        account: { ...account, providerAccountId: "google-sub-2" },
      },
      deps,
    );
    expect(other.sub).toBe("google-sub-2");
  });

  it("keeps the stable sub when Drive was not granted", async () => {
    const next = await rotateGoogleToken(
      {
        token: { ...base, sub: randomSub() },
        account: { ...account, scope: "openid email profile" },
      },
      depsWith(fakeFetch(new Error("unused"))),
    );
    expect(next).toMatchObject({ sub: "google-sub-1", error: "RefreshFailed" });
  });

  it("issues no usable session id or tokens when the account has no providerAccountId", async () => {
    const deps = depsWith(fakeFetch(new Error("unused")));
    for (const providerAccountId of [undefined, ""]) {
      const next = await rotateGoogleToken(
        { token: { ...base, sub: randomSub() }, account: { ...account, providerAccountId } },
        deps,
      );
      expect(next).not.toHaveProperty("sub");
      expect(next).not.toHaveProperty("accessToken");
      expect(next).not.toHaveProperty("refreshToken");
    }
  });

  it("flags RefreshFailed at sign-in when Drive was not granted or no refresh token came back", async () => {
    for (const partial of [
      { ...account, scope: "openid email profile" },
      { ...account, refresh_token: undefined },
    ]) {
      const next = await rotateGoogleToken(
        { token: { ...base, sub: randomSub() }, account: partial },
        depsWith(fakeFetch(new Error("unused"))),
      );
      expect(next.error).toBe("RefreshFailed");
    }
  });

  it("returns the same token while the access token is fresh", async () => {
    const token = { ...base, accessToken: "a1", refreshToken: "r1", expiresAt: NOW_SEC + 600 };
    const fetchFn = fakeFetch(new Error("unused"));
    await expect(rotateGoogleToken({ token }, depsWith(fetchFn))).resolves.toBe(token);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("replaces an expiring access token after a successful refresh", async () => {
    const token = { ...base, ...state };
    const fetchFn = fakeFetch(json(200, { access_token: "a2", expires_in: 3599 }));
    await expect(rotateGoogleToken({ token }, depsWith(fetchFn))).resolves.toEqual({
      ...base,
      accessToken: "a2",
      refreshToken: "r1",
      expiresAt: NOW_SEC + 3599,
    });
  });

  it("flags RefreshFailed when Google rejects the refresh, then stops calling Google", async () => {
    const flagged = await rotateGoogleToken(
      { token: { ...base, ...state } },
      depsWith(fakeFetch(json(400, { error: "invalid_grant" }))),
    );
    expect(flagged).toEqual({ ...base, ...state, error: "RefreshFailed" });
    const fetchFn = fakeFetch(json(200, { access_token: "a2", expires_in: 3599 }));
    await expect(rotateGoogleToken({ token: flagged }, depsWith(fetchFn))).resolves.toBe(flagged);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("leaves the token untouched when Google is unavailable, so the next request retries", async () => {
    const token = { ...base, ...state };
    await expect(rotateGoogleToken({ token }, depsWith(fakeFetch(json(503, {}))))).resolves.toBe(
      token,
    );
  });

  it("flags RefreshFailed for a token without Google credentials", async () => {
    const next = await rotateGoogleToken(
      { token: { sub: "google-sub-1" } },
      depsWith(fakeFetch(new Error("unused"))),
    );
    expect(next.error).toBe("RefreshFailed");
  });
});

describe("resolveDriveAccess (route handlers)", () => {
  it("maps cookie state to unauthenticated / reauth / ok without calling Google when not needed", async () => {
    const fetchFn = fakeFetch(new Error("unused"));
    await expect(resolveDriveAccess(null, depsWith(fetchFn))).resolves.toEqual({
      kind: "unauthenticated",
    });
    await expect(
      resolveDriveAccess({ ...base, ...state, error: "RefreshFailed" }, depsWith(fetchFn)),
    ).resolves.toEqual({ kind: "reauth" });
    await expect(resolveDriveAccess({ sub: "google-sub-1" }, depsWith(fetchFn))).resolves.toEqual({
      kind: "reauth",
    });
    await expect(
      resolveDriveAccess({ ...base, ...state, expiresAt: NOW_SEC + 600 }, depsWith(fetchFn)),
    ).resolves.toEqual({ kind: "ok", accessToken: "a1" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("refreshes an expiring token in memory and maps each refresh outcome", async () => {
    const token = { ...base, ...state };
    await expect(
      resolveDriveAccess(
        token,
        depsWith(fakeFetch(json(200, { access_token: "a2", expires_in: 3599 }))),
      ),
    ).resolves.toEqual({ kind: "ok", accessToken: "a2" });
    await expect(
      resolveDriveAccess(token, depsWith(fakeFetch(json(400, { error: "invalid_grant" })))),
    ).resolves.toEqual({ kind: "reauth" });
    await expect(resolveDriveAccess(token, depsWith(fakeFetch(json(503, {}))))).resolves.toEqual({
      kind: "unavailable",
    });
  });
});

describe("revokeGoogleToken (sign-out)", () => {
  const token = { ...base, accessToken: "a1", refreshToken: "r1", expiresAt: NOW_SEC + 600 };

  it("posts the refresh token to Google's revoke endpoint with a timeout signal", async () => {
    const fetchFn = fakeFetch(new Response("{}", { status: 200 }));
    await expect(revokeGoogleToken(token, fetchFn)).resolves.toBe("revoked");
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/revoke");
    expect(init?.method).toBe("POST");
    expect(Object.fromEntries(new URLSearchParams(String(init?.body)))).toEqual({ token: "r1" });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("falls back to the access token when there is no refresh token", async () => {
    const fetchFn = fakeFetch(new Response("{}", { status: 200 }));
    await revokeGoogleToken({ ...token, refreshToken: undefined }, fetchFn);
    expect(new URLSearchParams(String(fetchFn.mock.calls[0][1]?.body)).get("token")).toBe("a1");
  });

  it("reports failed on a Google error and never throws", async () => {
    await expect(
      revokeGoogleToken(token, fakeFetch(json(400, { error: "invalid_token" }))),
    ).resolves.toBe("failed");
  });

  it("reports failed on a network error or timeout and never throws", async () => {
    for (const error of [new TypeError("fetch failed"), new DOMException("t", "TimeoutError")]) {
      await expect(revokeGoogleToken(token, fakeFetch(error))).resolves.toBe("failed");
    }
  });

  it("skips without calling Google when the token holds no Google token", async () => {
    const fetchFn = fakeFetch(new Error("unused"));
    for (const empty of [null, undefined, {}, { accessToken: "", refreshToken: 3 }]) {
      await expect(revokeGoogleToken(empty, fetchFn)).resolves.toBe("skipped");
    }
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
