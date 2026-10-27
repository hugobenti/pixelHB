import { describe, expect, it, vi } from "vitest";

import type { IGoogleRefreshDeps, IGoogleTokenState } from "../auth.type";
import {
  needsRefresh,
  refreshGoogleAccessToken,
  resolveDriveAccess,
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
const account = {
  access_token: "a1",
  refresh_token: "r1",
  expires_at: NOW_SEC + 3600,
  scope: `openid email profile ${DRIVE}`,
};

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

  it("reports rejected when Google refuses the grant (400 invalid_grant, 401 invalid_client)", async () => {
    for (const status of [400, 401]) {
      const fetchFn = fakeFetch(json(status, { error: "invalid_grant" }));
      await expect(refreshGoogleAccessToken(state, depsWith(fetchFn))).resolves.toEqual({
        kind: "rejected",
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
    await expect(rotateGoogleToken({ token: base, account }, depsWith(fetchFn))).resolves.toEqual({
      ...base,
      accessToken: "a1",
      refreshToken: "r1",
      expiresAt: NOW_SEC + 3600,
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("flags RefreshFailed at sign-in when Drive was not granted or no refresh token came back", async () => {
    for (const partial of [
      { ...account, scope: "openid email profile" },
      { ...account, refresh_token: undefined },
    ]) {
      const next = await rotateGoogleToken(
        { token: base, account: partial },
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
