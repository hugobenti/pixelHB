import { describe, expect, it } from "vitest";

import { decidePendingWipe, isAccountSettled } from "./pendingWipe";

describe("decidePendingWipe", () => {
  it("wipes the marked owner once signed out", () => {
    expect(decidePendingWipe("signedOut", null, "u1")).toEqual({ kind: "wipe", ownerId: "u1" });
  });

  it("drops the marker without wiping when the same account signed back in", () => {
    expect(decidePendingWipe("signedIn", "u1", "u1")).toEqual({ kind: "clear" });
  });

  it("wipes the marked owner when a different account is signed in", () => {
    expect(decidePendingWipe("signedIn", "u2", "u1")).toEqual({ kind: "wipe", ownerId: "u1" });
  });

  it("waits when signed in without a known user id", () => {
    expect(decidePendingWipe("signedIn", null, "u1")).toEqual({ kind: "none" });
  });

  it("waits while the session loads", () => {
    expect(decidePendingWipe("loading", null, "u1")).toEqual({ kind: "none" });
  });

  it("does nothing without a marker", () => {
    for (const s of ["signedOut", "signedIn", "loading"] as const) {
      expect(decidePendingWipe(s, "u1", null)).toEqual({ kind: "none" });
    }
  });
});

describe("isAccountSettled", () => {
  it("is true only for a signed-in or signed-out state the server confirmed", () => {
    expect(isAccountSettled({ status: "signedIn" })).toBe(true);
    expect(isAccountSettled({ status: "signedOut" })).toBe(true);
    expect(isAccountSettled({ status: "signedIn", provisional: false })).toBe(true);
    expect(isAccountSettled({ status: "signedIn", provisional: true })).toBe(false);
    expect(isAccountSettled({ status: "signedOut", provisional: true })).toBe(false);
    expect(isAccountSettled({ status: "loading" })).toBe(false);
  });
});
