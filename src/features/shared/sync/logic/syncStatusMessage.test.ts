import { describe, expect, it } from "vitest";

import { shared } from "@/content/shared";
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
  missingInDriveIds: [],
  driveFolderTrashed: false,
  clockSkewIds: [],
  driveFull: false,
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

  describe("drive full, clock skew and kept removals", () => {
    it("says the Drive is full, ahead of offline, while the flag is set", () => {
      expect(syncStatusMessage(signedIn, { ...idle, phase: "error", driveFull: true })).toEqual({
        key: "driveFull",
        tone: "attention",
        count: 0,
      });
      expect(syncStatusMessage(signedIn, { ...idle, phase: "syncing", driveFull: true })?.key).toBe("driveFull");
      expect(syncStatusText({ key: "driveFull", tone: "attention", count: 0 })).toBe(shared.sync.driveFull);
    });

    it("still asks to sign in again before the Drive-full note, and says nothing of it when the engine is off", () => {
      expect(syncStatusMessage(signedIn, { ...idle, phase: "reauth", driveFull: true })?.key).toBe("signInAgain");
      expect(syncStatusMessage(signedIn, { ...idle, phase: "disabled", driveFull: true })?.key).toBe("thisBrowserOnly");
      expect(syncStatusMessage(signedOut, { ...idle, driveFull: true })?.key).toBe("thisBrowserOnly");
    });

    it("says the clock looks wrong, ahead of offline, counting the artworks that cannot sync", () => {
      const skewed: ISyncStatus = { ...idle, phase: "error", pendingCount: 2, clockSkewIds: ["a", "b"] };
      expect(syncStatusMessage(signedIn, skewed)).toEqual({ key: "clockSkew", tone: "attention", count: 2 });
      expect(syncStatusText({ key: "clockSkew", tone: "attention", count: 2 })).toBe(shared.sync.clockSkew(2));
    });

    it("scoped to one artwork, only that artwork's clock problem counts", () => {
      const skewed: ISyncStatus = { ...idle, phase: "error", pendingCount: 1, clockSkewIds: ["other"] };
      expect(syncStatusMessage(signedIn, skewed, { artworkId: "mine" })?.key).toBe("offline");
      expect(syncStatusMessage(signedIn, skewed, { artworkId: "other" })).toEqual({
        key: "clockSkew",
        tone: "attention",
        count: 1,
      });
    });

    it("tells how many artworks Drive no longer holds and that they are kept here", () => {
      const missing: ISyncStatus = { ...idle, missingInDriveIds: ["a", "b", "c", "d"] };
      expect(syncStatusMessage(signedIn, missing)).toEqual({ key: "missingInDrive", tone: "attention", count: 4 });
      expect(syncStatusText({ key: "missingInDrive", tone: "attention", count: 4 })).toBe(shared.sync.missingInDrive(4));
      expect(shared.sync.missingInDrive(4)).toContain("delete them here");
      expect(shared.sync.missingInDrive(1)).toContain("delete it here");
    });

    it("says the PixelHB folder is in the Drive trash, ahead of the missing note", () => {
      const trashed: ISyncStatus = { ...idle, driveFolderTrashed: true, missingInDriveIds: ["a"] };
      expect(syncStatusMessage(signedIn, trashed)).toEqual({ key: "driveFolderTrashed", tone: "attention", count: 0 });
      expect(syncStatusText({ key: "driveFolderTrashed", tone: "attention", count: 0 })).toBe(shared.sync.driveFolderTrashed);
    });

    it("shows these notes only when nothing more urgent applies, and never in an editor scope", () => {
      const kept: ISyncStatus = { ...idle, missingInDriveIds: ["a"], driveFolderTrashed: true };
      expect(syncStatusMessage(signedIn, { ...kept, phase: "offline" })?.key).toBe("offline");
      expect(syncStatusMessage(signedIn, { ...kept, phase: "syncing" })?.key).toBe("syncing");
      expect(syncStatusMessage(signedIn, { ...kept, pendingCount: 1, tooLargeIds: ["x"] })?.key).toBe("tooLarge");
      expect(syncStatusMessage(signedIn, kept, { artworkId: "mine" })?.key).toBe("saved");
    });
  });
});
