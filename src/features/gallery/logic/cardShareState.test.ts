import { describe, expect, it } from "vitest";

import { cardShareState } from "./cardShareState";

describe("cardShareState", () => {
  it("is preparing while nothing is rendered and nothing failed", () => {
    expect(cardShareState({ rendered: false, failed: false })).toBe("preparing");
  });

  it("is ready once a PNG exists", () => {
    expect(cardShareState({ rendered: true, failed: false })).toBe("ready");
  });

  it("is failed when loading or rendering failed", () => {
    expect(cardShareState({ rendered: false, failed: true })).toBe("failed");
  });
});
