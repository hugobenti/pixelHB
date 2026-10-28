import { describe, expect, it, vi } from "vitest";

import type { IAccountHint, IAccountState, TSessionFetchResult } from "../auth.type";
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
  it("reads HTTP 404 (the auth route is off) as signed out", async () => {
    await expect(
      fetchAccountSession(fetchOf(new Response("Not found", { status: 404 }))),
    ).resolves.toEqual({ kind: "signedOut" });
  });
  it("maps network errors, timeouts, other non-2xx and non-JSON bodies to failed", async () => {
    for (const result of [
      new TypeError("Failed to fetch"),
      new DOMException("timed out", "TimeoutError"),
      new Response("null", { status: 500 }),
      new Response("null", { status: 401 }),
      new Response("<html>Bad gateway</html>", { status: 200 }),
      new Response("", { status: 200 }),
    ]) {
      await expect(fetchAccountSession(fetchOf(result))).resolves.toEqual({ kind: "failed" });
    }
  });
});

describe("nextAccountState", () => {
  const hint: IAccountHint = { id: "google-sub-1", name: "Ada", image: null };
  const provisionalIn: IAccountState = {
    status: "signedIn",
    user: { id: "google-sub-1", name: "Ada", email: "", image: null },
    needsReauth: false,
    provisional: true,
  };
  const provisionalOut: IAccountState = { ...signedOut, provisional: true };
  const failed: TSessionFetchResult = { kind: "failed" };
  const answerIn: TSessionFetchResult = { kind: "signedIn", session };
  const answerOut: TSessionFetchResult = { kind: "signedOut" };

  const table: [string, IAccountState, TSessionFetchResult, IAccountHint | null, IAccountState][] =
    [
      ["first load, signed in", LOADING_ACCOUNT, answerIn, null, signedIn],
      ["first load, explicit signed out (also 404)", LOADING_ACCOUNT, answerOut, hint, signedOut],
      [
        "first load fails, no hint: provisional signed out",
        LOADING_ACCOUNT,
        failed,
        null,
        provisionalOut,
      ],
      [
        "first load fails, hint: provisional signed in as the hinted owner",
        LOADING_ACCOUNT,
        failed,
        hint,
        provisionalIn,
      ],
      ["signed in, then a failure keeps the user", signedIn, failed, hint, signedIn],
      ["signed in, then explicit null really signs out", signedIn, answerOut, hint, signedOut],
      ["signed in, same session again", signedIn, answerIn, hint, signedIn],
      [
        "signed in, session now says RefreshFailed",
        signedIn,
        { kind: "signedIn", session: { ...session, error: "RefreshFailed" } },
        hint,
        needsReauth,
      ],
      ["needs reauth, re-consent clears it", needsReauth, answerIn, hint, signedIn],
      ["needs reauth, then a failure keeps it", needsReauth, failed, hint, needsReauth],
      ["signed out, then a failure stays signed out", signedOut, failed, hint, signedOut],
      ["signed out, then signed in elsewhere", signedOut, answerIn, null, signedIn],
      ["signed out, still signed out", signedOut, answerOut, null, signedOut],
      [
        "provisional signed in, failure again keeps the guess",
        provisionalIn,
        failed,
        hint,
        provisionalIn,
      ],
      [
        "provisional signed in, server confirms: real signed in",
        provisionalIn,
        answerIn,
        hint,
        signedIn,
      ],
      [
        "provisional signed in, server says null: signed out",
        provisionalIn,
        answerOut,
        hint,
        signedOut,
      ],
      [
        "provisional signed in, server says another user",
        provisionalIn,
        { kind: "signedIn", session: { ...session, user: { ...user, id: "google-sub-2" } } },
        hint,
        { ...signedIn, user: { ...user, id: "google-sub-2" } },
      ],
      [
        "provisional signed out, failure again keeps the guess",
        provisionalOut,
        failed,
        null,
        provisionalOut,
      ],
      [
        "provisional signed out, server confirms null: definitive",
        provisionalOut,
        answerOut,
        null,
        signedOut,
      ],
      ["provisional signed out, server says signed in", provisionalOut, answerIn, null, signedIn],
    ];
  it.each(table)("%s", (_name, previous, result, hintArg, expected) => {
    const next = nextAccountState(previous, result, hintArg);
    expect(next).toEqual(expected);
    expect(Boolean(next.provisional)).toBe(Boolean(expected.provisional));
  });

  it("never invents an email or a token for the provisional user", () => {
    expect(nextAccountState(LOADING_ACCOUNT, failed, hint).user).toEqual({
      id: "google-sub-1",
      name: "Ada",
      email: "",
      image: null,
    });
  });

  it("returns the previous object when nothing changed, so React does not re-render", () => {
    expect(nextAccountState(signedIn, answerIn, null)).toBe(signedIn);
    expect(nextAccountState(signedOut, answerOut, null)).toBe(signedOut);
    expect(nextAccountState(signedIn, failed, null)).toBe(signedIn);
    expect(nextAccountState(provisionalIn, failed, hint)).toBe(provisionalIn);
  });

  it("switches to the new user when the owner changes without a signed-out answer in between", () => {
    const other = { ...session, user: { ...user, id: "google-sub-2" } };
    expect(nextAccountState(signedIn, { kind: "signedIn", session: other }, null).user?.id).toBe(
      "google-sub-2",
    );
  });
});
