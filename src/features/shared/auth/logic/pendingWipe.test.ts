import { describe, expect, it } from "vitest";

import { decidePendingWipe } from "./pendingWipe";

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

  it("waits while the session loads and ignores a disabled feature", () => {
    expect(decidePendingWipe("loading", null, "u1")).toEqual({ kind: "none" });
    expect(decidePendingWipe("disabled", null, "u1")).toEqual({ kind: "none" });
  });

  it("does nothing without a marker", () => {
    for (const s of ["signedOut", "signedIn", "loading", "disabled"] as const) {
      expect(decidePendingWipe(s, "u1", null)).toEqual({ kind: "none" });
    }
  });
});
