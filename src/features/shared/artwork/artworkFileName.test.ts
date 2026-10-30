import { describe, expect, it } from "vitest";

import { sanitizeFileNameSegment } from "./artworkFileName";

describe("sanitizeFileNameSegment", () => {
  it("lowercases, collapses unsafe runs and falls back to artwork", () => {
    expect(sanitizeFileNameSegment("My  Art!!")).toBe("my-art-");
    expect(sanitizeFileNameSegment("   ")).toBe("artwork");
  });
});
