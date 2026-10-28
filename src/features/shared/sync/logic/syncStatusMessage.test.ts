import { describe, expect, it } from "vitest";

import type { IAccountState } from "@/features/shared/auth/auth.type";
import type { ISyncStatus } from "@/features/shared/sync/sync.type";
import { syncStatusMessage, syncStatusText } from "./syncStatusMessage";

const user = { id: "u1", name: "Ada", email: "ada@example.com", image: null };
const signedIn: IAccountState = { status: "signedIn", user, needsReauth: false };
const signedOut: IAccountState = { status: "signedOut", user: null, needsReauth: false };
const idle: ISyncStatus = {
  phase: "idle",
  pendingCount: 0,
  remoteOnly: [],
  tooLargeIds: [],
  lastSyncedAt: 1,
};

describe("syncStatusMessage", () => {
  it("says this browser only when signed out or when the flag is off", () => {
    expect(syncStatusMessage(signedOut, idle)).toEqual({
      key: "thisBrowserOnly",
      tone: "neutral",
      count: 0,
    });
    expect(
      syncStatusMessage(
        { status: "disabled", user: null, needsReauth: false },
        { ...idle, phase: "disabled" },
      ),
    ).toEqual({ key: "thisBrowserOnly", tone: "neutral", count: 0 });
  });

  it("says nothing while the account is still loading", () => {
    expect(
      syncStatusMessage({ status: "loading", user: null, needsReauth: false }, idle),
    ).toBeNull();
  });

  it("says saved when signed in, idle and nothing pending", () => {
    expect(syncStatusMessage(signedIn, idle)).toEqual({ key: "saved", tone: "neutral", count: 0 });
  });

  it("says this browser only when signed in but the engine never started", () => {
    expect(syncStatusMessage(signedIn, { ...idle, phase: "disabled" })).toEqual({
      key: "thisBrowserOnly",
      tone: "neutral",
      count: 0,
    });
  });

  it("says syncing while the engine runs", () => {
    expect(syncStatusMessage(signedIn, { ...idle, phase: "syncing" })?.key).toBe("syncing");
    expect(syncStatusMessage(signedIn, { ...idle, phase: "syncing" })?.tone).toBe("progress");
  });

  it("says syncing, not saved, when idle with changes waiting to be pushed", () => {
    expect(syncStatusMessage(signedIn, { ...idle, pendingCount: 1 })?.key).toBe("syncing");
  });

  it("says offline when Drive can't be reached or answered with an error", () => {
    expect(syncStatusMessage(signedIn, { ...idle, phase: "offline" })).toEqual({
      key: "offline",
      tone: "attention",
      count: 0,
    });
    expect(syncStatusMessage(signedIn, { ...idle, phase: "error" })?.key).toBe("offline");
  });

  it("asks to sign in again on phase reauth or when the session says so", () => {
    expect(syncStatusMessage(signedIn, { ...idle, phase: "reauth" })).toEqual({
      key: "signInAgain",
      tone: "attention",
      count: 0,
    });
    expect(syncStatusMessage({ ...signedIn, needsReauth: true }, idle)?.key).toBe("signInAgain");
  });

  it("counts too-large artworks when they are the only thing pending", () => {
    expect(
      syncStatusMessage(signedIn, { ...idle, pendingCount: 2, tooLargeIds: ["a", "b"] }),
    ).toEqual({ key: "tooLarge", tone: "attention", count: 2 });
  });

  it("applies precedence reauth > offline > syncing > tooLarge > saved", () => {
    const everything: ISyncStatus = {
      ...idle,
      phase: "offline",
      pendingCount: 3,
      tooLargeIds: ["a"],
    };
    expect(syncStatusMessage({ ...signedIn, needsReauth: true }, everything)?.key).toBe(
      "signInAgain",
    );
    expect(syncStatusMessage(signedIn, everything)?.key).toBe("offline");
    expect(syncStatusMessage(signedIn, { ...everything, phase: "syncing" })?.key).toBe("syncing");
    expect(
      syncStatusMessage(signedIn, { ...everything, phase: "idle", pendingCount: 1 })?.key,
    ).toBe("tooLarge");
  });

  it("scoped to one artwork, ignores other artworks that are too large", () => {
    const status: ISyncStatus = { ...idle, pendingCount: 1, tooLargeIds: ["other"] };
    expect(syncStatusMessage(signedIn, status, { artworkId: "mine" })?.key).toBe("saved");
    expect(syncStatusMessage(signedIn, status, { artworkId: "other" })).toEqual({
      key: "tooLarge",
      tone: "attention",
      count: 1,
    });
  });

  it("says the drawings are unconfirmed while the account is provisional, naming the owner", () => {
    const provisional: IAccountState = { ...signedIn, provisional: true };
    expect(syncStatusMessage(provisional, { ...idle, phase: "offline" })).toEqual({
      key: "unconfirmed",
      tone: "neutral",
      count: 0,
      name: "Ada",
    });
    expect(syncStatusText({ key: "unconfirmed", tone: "neutral", count: 0, name: "Ada" })).toBe(
      "Can’t confirm your account right now. Showing Ada’s drawings; changes sync once we can.",
    );
    expect(syncStatusText({ key: "unconfirmed", tone: "neutral", count: 0 })).toContain(
      "Showing your drawings here; changes sync once we can.",
    );
  });
});
