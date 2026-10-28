import { describe, expect, it } from "vitest";

import { MAX_CLOCK_SKEW_MS } from "@/features/shared/drive/galleryApi";
import { deletionStamp, nextUpdatedAt } from "./updatedAtStamp";

const NOW = 1_000_000_000_000;
const stored = (updatedAt: number, syncedUpdatedAt: number | null) => ({
  updatedAt,
  sync: { state: "dirty" as const, syncedUpdatedAt },
});

describe("nextUpdatedAt", () => {
  it("is the wall clock when it is ahead of the stored stamp", () => {
    expect(nextUpdatedAt(NOW, stored(NOW - 5000, null))).toBe(NOW);
  });

  it("goes one past the stored stamp when the clock did not advance (same millisecond or stepped back)", () => {
    expect(nextUpdatedAt(NOW, stored(NOW, null))).toBe(NOW + 1);
    expect(nextUpdatedAt(NOW, stored(NOW + 60_000, null))).toBe(NOW + 60_001);
  });

  it("keeps outranking a future stamp the server may already hold", () => {
    expect(
      nextUpdatedAt(NOW, stored(NOW + 10 * MAX_CLOCK_SKEW_MS, NOW + 10 * MAX_CLOCK_SKEW_MS)),
    ).toBe(NOW + 10 * MAX_CLOCK_SKEW_MS + 1);
  });

  it("drops a future stamp that Drive never accepted, so a corrected clock can sync again", () => {
    // The server refused it (too far ahead); outranking it would keep every later edit refused too.
    expect(nextUpdatedAt(NOW, stored(NOW + 365 * 24 * 3_600_000, null))).toBe(NOW);
  });

  it("still outranks the version Drive does hold when dropping an unaccepted future stamp", () => {
    expect(nextUpdatedAt(NOW, stored(NOW + 365 * 24 * 3_600_000, NOW + 1000))).toBe(NOW + 1001);
  });

  it("treats a stamp within the tolerance as ordinary", () => {
    expect(nextUpdatedAt(NOW, stored(NOW + MAX_CLOCK_SKEW_MS, null))).toBe(
      NOW + MAX_CLOCK_SKEW_MS + 1,
    );
  });
});

describe("deletionStamp", () => {
  it("is the wall clock, or the version Drive holds when that is later", () => {
    expect(deletionStamp(NOW, NOW - 1)).toBe(NOW);
    expect(deletionStamp(NOW, NOW + 5000)).toBe(NOW + 5000);
    expect(deletionStamp(NOW, null)).toBe(NOW);
  });
});
