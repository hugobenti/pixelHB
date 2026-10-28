import { describe, expect, it } from "vitest";

import { runSignOut } from "./signOutRun";
import type { ISignOutDeps } from "./signOutRun.type";

function setup(overrides: Partial<ISignOutDeps> = {}) {
  const calls: string[] = [];
  const deps: ISignOutDeps = {
    signOut: async () => (calls.push("signOut"), { url: "/" }),
    verifySignedOut: async () => (calls.push("verify"), true),
    writeMarker: (id) => void calls.push(`writeMarker:${id}`),
    stopEngine: async () => void calls.push("stop"),
    wipeOwner: async (id) => void calls.push(`wipe:${id}`),
    clearMarker: () => void calls.push("clearMarker"),
    clearAccountHint: () => void calls.push("clearHint"),
    setActiveOwner: (id) => void calls.push(`owner:${id}`),
    ...overrides,
  };
  return { calls, deps };
}

describe("runSignOut", () => {
  it("signs out, verifies, writes the marker, stops, wipes, then clears the marker", async () => {
    const { calls, deps } = setup();
    await expect(runSignOut("u1", deps)).resolves.toBe("done");
    expect(calls).toEqual([
      "signOut",
      "verify",
      "clearHint",
      "writeMarker:u1",
      "owner:null",
      "stop",
      "wipe:u1",
      "clearMarker",
    ]);
  });

  it("deletes nothing when the sign-out throws", async () => {
    const { calls, deps } = setup({
      signOut: async () => {
        throw new TypeError("offline");
      },
    });
    await expect(runSignOut("u1", deps)).resolves.toBe("signOutFailed");
    expect(calls).toEqual([]);
  });

  it("deletes nothing when the sign-out could not be verified", async () => {
    const { calls, deps } = setup({ verifySignedOut: async () => false });
    await expect(runSignOut("u1", deps)).resolves.toBe("signOutFailed");
    expect(calls).toEqual(["signOut"]);
  });

  it("deletes nothing when verification throws", async () => {
    const { calls, deps } = setup({
      verifySignedOut: async () => {
        throw new Error("x");
      },
    });
    await expect(runSignOut("u1", deps)).resolves.toBe("signOutFailed");
    expect(calls).toEqual(["signOut"]);
  });

  it("keeps the marker and reports failure when the wipe fails", async () => {
    const { calls, deps } = setup({
      wipeOwner: async () => {
        throw new Error("idb");
      },
    });
    await expect(runSignOut("u1", deps)).resolves.toBe("wipeFailed");
    expect(calls).toContain("writeMarker:u1");
    expect(calls).not.toContain("clearMarker");
  });

  it("keeps the marker when stopping the engine fails", async () => {
    const { calls, deps } = setup({
      stopEngine: async () => {
        throw new Error("x");
      },
    });
    await expect(runSignOut("u1", deps)).resolves.toBe("wipeFailed");
    expect(calls).not.toContain("wipe:u1");
    expect(calls).not.toContain("clearMarker");
  });
});
