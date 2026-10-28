import { describe, expect, it, vi } from "vitest";

import type { IAccountState, TSessionFetchResult } from "../auth.type";
import {
  LOADING_ACCOUNT,
  classifySessionBody,
  fetchAccountSession,
  nextAccountState,
  retryDelayMs,
} from "./accountSession";

const user = { id: "google-sub-1", name: "Ada", email: "ada@example.com", image: null };
const session = { user, expires: "2026-11-26T00:00:00.000Z" };
const signedIn: IAccountState = { status: "signedIn", user, needsReauth: false };
const needsReauth: IAccountState = { ...signedIn, needsReauth: true };
const signedOut: IAccountState = { status: "signedOut", user: null, needsReauth: false };

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("retryDelayMs", () => {
  it("doubles from 2 s and caps at 60 s", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 50].map(retryDelayMs)).toEqual([
      2000, 4000, 8000, 16_000, 32_000, 60_000, 60_000, 60_000,
    ]);
  });
});

describe("classifySessionBody", () => {
  it("reads null, {} and a body without a user id as signed out", () => {
    for (const body of [null, {}, { user: null }, { user: {} }, { user: { id: "" } }]) {
      expect(classifySessionBody(body)).toEqual({ kind: "signedOut" });
    }
  });
  it("reads a body with a user id as signed in", () => {
    expect(classifySessionBody(session)).toEqual({ kind: "signedIn", session });
  });
  it("reads anything that is not a session as a failure, not as signed out", () => {
    for (const body of [[], "oops", 3, true, { user: "x" }, { user: [] }]) {
      expect(classifySessionBody(body)).toEqual({ kind: "failed" });
    }
  });
});

describe("fetchAccountSession", () => {
  const fetchOf = (result: Response | Error) =>
    vi.fn<typeof fetch>(async () => {
      if (result instanceof Error) throw result;
      return result;
    });

  it("requests the session uncached with a timeout signal", async () => {
    const fetchFn = fetchOf(ok(null));
    await fetchAccountSession(fetchFn);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("/api/auth/session");
    expect(init?.cache).toBe("no-store");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
  it("maps HTTP 200 null / {} to signedOut and a user to signedIn", async () => {
    await expect(fetchAccountSession(fetchOf(ok(null)))).resolves.toEqual({ kind: "signedOut" });
    await expect(fetchAccountSession(fetchOf(ok({})))).resolves.toEqual({ kind: "signedOut" });
    await expect(fetchAccountSession(fetchOf(ok(session)))).resolves.toEqual({
      kind: "signedIn",
      session,
    });
  });
  it("maps network errors, timeouts, non-2xx and non-JSON bodies to failed", async () => {
    for (const result of [
      new TypeError("Failed to fetch"),
      new DOMException("timed out", "TimeoutError"),
      new Response("null", { status: 500 }),
      new Response("null", { status: 404 }),
      new Response("null", { status: 401 }),
      new Response("<html>Bad gateway</html>", { status: 200 }),
      new Response("", { status: 200 }),
    ]) {
      await expect(fetchAccountSession(fetchOf(result))).resolves.toEqual({ kind: "failed" });
    }
  });
});

describe("nextAccountState", () => {
  const table: [string, IAccountState, TSessionFetchResult, IAccountState][] = [
    ["first load, signed in", LOADING_ACCOUNT, { kind: "signedIn", session }, signedIn],
    ["first load, explicit signed out", LOADING_ACCOUNT, { kind: "signedOut" }, signedOut],
    ["first load offline stays loading", LOADING_ACCOUNT, { kind: "failed" }, LOADING_ACCOUNT],
    ["signed in, then a failure keeps the user", signedIn, { kind: "failed" }, signedIn],
    ["signed in, then explicit null really signs out", signedIn, { kind: "signedOut" }, signedOut],
    ["signed in, same session again", signedIn, { kind: "signedIn", session }, signedIn],
    [
      "signed in, session now says RefreshFailed",
      signedIn,
      { kind: "signedIn", session: { ...session, error: "RefreshFailed" } },
      needsReauth,
    ],
    ["needs reauth, re-consent clears it", needsReauth, { kind: "signedIn", session }, signedIn],
    ["needs reauth, then a failure keeps it", needsReauth, { kind: "failed" }, needsReauth],
    ["signed out, then a failure stays signed out", signedOut, { kind: "failed" }, signedOut],
    ["signed out, then signed in elsewhere", signedOut, { kind: "signedIn", session }, signedIn],
    ["signed out, still signed out", signedOut, { kind: "signedOut" }, signedOut],
  ];
  it.each(table)("%s", (_name, previous, result, expected) => {
    expect(nextAccountState(previous, result)).toEqual(expected);
  });

  it("returns the previous object when nothing changed, so React does not re-render", () => {
    expect(nextAccountState(signedIn, { kind: "signedIn", session })).toBe(signedIn);
    expect(nextAccountState(signedOut, { kind: "signedOut" })).toBe(signedOut);
    expect(nextAccountState(signedIn, { kind: "failed" })).toBe(signedIn);
  });

  it("switches to the new user when the owner changes without a signed-out answer in between", () => {
    const other = { ...session, user: { ...user, id: "google-sub-2" } };
    expect(nextAccountState(signedIn, { kind: "signedIn", session: other }).user?.id).toBe(
      "google-sub-2",
    );
  });
});
