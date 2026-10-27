import { describe, expect, it } from "vitest";

import { decidePendingWipe } from "./pendingWipe";

describe("decidePendingWipe", () => {
  it("wipes the marked owner once signed out", () => {
    expect(decidePendingWipe("signedOut", "u1")).toEqual({ kind: "wipe", ownerId: "u1" });
  });

  it("drops a stale marker without wiping when signed in", () => {
    expect(decidePendingWipe("signedIn", "u1")).toEqual({ kind: "clear" });
  });

  it("waits while the session loads and ignores a disabled feature", () => {
    expect(decidePendingWipe("loading", "u1")).toEqual({ kind: "none" });
    expect(decidePendingWipe("disabled", "u1")).toEqual({ kind: "none" });
  });

  it("does nothing without a marker", () => {
    for (const s of ["signedOut", "signedIn", "loading", "disabled"] as const) {
      expect(decidePendingWipe(s, null)).toEqual({ kind: "none" });
    }
  });
});
