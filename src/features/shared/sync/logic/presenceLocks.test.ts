import { describe, expect, it } from "vitest";

import { openIdsFromLocks, openLockName, SYNC_LOCK_NAME } from "./presenceLocks";

describe("openIdsFromLocks", () => {
  it("counts held and pending shared editor locks as open", () => {
    expect(
      openIdsFromLocks({
        held: [{ name: openLockName("a"), mode: "shared" }, { name: SYNC_LOCK_NAME, mode: "exclusive" }, { name: "other", mode: "shared" }],
        pending: [{ name: openLockName("b"), mode: "shared" }],
      }),
    ).toEqual(new Set(["a", "b"]));
  });
  it("ignores the engine's own exclusive wait for an editor to close", () => {
    expect(openIdsFromLocks({ held: [], pending: [{ name: openLockName("a"), mode: "exclusive" }] })).toEqual(new Set());
  });
  it("treats a missing snapshot list as nothing open", () => {
    expect(openIdsFromLocks({})).toEqual(new Set());
  });
});
