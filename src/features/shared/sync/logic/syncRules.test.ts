import { describe, expect, it } from "vitest";

import type { TArtworkSyncState } from "@/features/shared/artwork/artworkSync.type";
import type { TPullAction } from "@/features/shared/sync/sync.type";
import { decidePull, nextBackoffMs, planPush, planSync, retryDelayMs } from "./syncRules";
import type { ILocalSyncFacts, IRemoteSyncFacts } from "./syncRules.type";

const L = (updatedAt: number, state: TArtworkSyncState, id = "a"): ILocalSyncFacts => ({ id, updatedAt, state });
const R = (updatedAt: number, id = "a"): IRemoteSyncFacts => ({ id, updatedAt });

describe("decidePull", () => {
  it.each<[string, ILocalSyncFacts | undefined, IRemoteSyncFacts | undefined, boolean, TPullAction]>([
    ["only in Drive", undefined, R(100), false, "download"],
    ["nowhere", undefined, undefined, false, "none"],
    ["synced, Drive newer", L(100, "synced"), R(200), false, "download"],
    ["synced, same version", L(100, "synced"), R(100), false, "none"],
    ["synced, Drive older (restored in Drive)", L(200, "synced"), R(100), false, "upload"],
    ["synced, gone from Drive (deleted elsewhere)", L(100, "synced"), undefined, false, "removeLocal"],
    ["dirty, gone from Drive (edit after delete wins)", L(100, "dirty"), undefined, false, "upload"],
    ["dirty, Drive newer (latest wins)", L(100, "dirty"), R(200), false, "download"],
    ["dirty, Drive older", L(200, "dirty"), R(100), false, "upload"],
    ["dirty, tie (Drive wins)", L(100, "dirty"), R(100), false, "download"],
    ["never synced, gone from Drive", L(100, "local"), undefined, false, "upload"],
    ["never synced, Drive newer", L(100, "local"), R(200), false, "download"],
    ["too large, gone from Drive", L(100, "tooLarge"), undefined, false, "none"],
    ["too large, Drive older", L(200, "tooLarge"), R(100), false, "none"],
    ["too large, Drive newer", L(100, "tooLarge"), R(200), false, "download"],
    ["too large, tie (Drive wins)", L(100, "tooLarge"), R(100), false, "download"],
    ["open: download over local copy deferred", L(100, "synced"), R(200), true, "defer"],
    ["open: removal deferred", L(100, "synced"), undefined, true, "defer"],
    ["open: no local copy, download is safe", undefined, R(100), true, "download"],
    ["open: upload still runs", L(200, "dirty"), R(100), true, "upload"],
    ["open: nothing to do", L(100, "synced"), R(100), true, "none"],
  ])("%s → %s", (_name, local, remote, isOpen, expected) => {
    expect(decidePull(local, remote, isOpen)).toBe(expected);
  });
});

describe("planSync", () => {
  it("splits every id into downloads (newest first), removals, uploads (oldest first) and deferred", () => {
    const plan = planSync(
      [L(300, "dirty", "up-new"), L(100, "dirty", "up-old"), L(50, "synced", "gone"), L(10, "synced", "open"), L(70, "synced", "same")],
      [R(500, "new-1"), R(900, "new-2"), R(20, "open"), R(70, "same"), R(50, "up-old"), R(10, "up-new")],
      new Set(["open"]),
    );
    expect(plan).toEqual({ downloads: ["new-2", "new-1"], removals: ["gone"], uploads: ["up-old", "up-new"], deferred: ["open"] });
  });
});

describe("planPush", () => {
  it("orders dirty rows oldest first (id breaks ties) and skips too-large and deferred rows", () => {
    expect(
      planPush([L(200, "dirty", "b"), L(200, "dirty", "a"), L(100, "dirty", "c"), L(50, "tooLarge", "t"), L(10, "dirty", "skip")], new Set(["skip"])),
    ).toEqual(["c", "a", "b"]);
  });
});

describe("backoff", () => {
  it.each([[0, 1_000], [1, 2_000], [5, 32_000], [8, 256_000], [9, 300_000], [30, 300_000]])("attempt %i waits %i ms", (attempt, ms) => {
    expect(nextBackoffMs(attempt)).toBe(ms);
  });
  it("honors Retry-After when longer, within the 5 min cap", () => {
    expect(retryDelayMs(0, 5_000)).toBe(5_000);
    expect(retryDelayMs(3, 1_000)).toBe(8_000);
    expect(retryDelayMs(0, 900_000)).toBe(300_000);
    expect(retryDelayMs(2, null)).toBe(4_000);
  });
});
