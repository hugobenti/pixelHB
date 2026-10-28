import { describe, expect, it } from "vitest";

import { parseAccountHint, serializeAccountHint, toAccountHint } from "./accountHint";

const user = { id: "g1", name: "Ada", email: "ada@example.com", image: "https://x/y.png" };

describe("account hint", () => {
  it("keeps id, name and image, never the email", () => {
    const hint = toAccountHint(user);
    expect(hint).toEqual({ id: "g1", name: "Ada", image: "https://x/y.png" });
    expect(serializeAccountHint(hint)).not.toContain("ada@example.com");
  });
  it("round-trips", () => {
    const hint = toAccountHint(user);
    expect(parseAccountHint(serializeAccountHint(hint))).toEqual(hint);
  });
  it("fills missing name and image", () => {
    expect(parseAccountHint('{"id":"g1"}')).toEqual({ id: "g1", name: "", image: null });
  });
  it("rejects anything without a non-empty string id", () => {
    for (const raw of [null, "", "nope", "null", "[]", "3", '{"id":""}', '{"id":3}', "{}"]) {
      expect(parseAccountHint(raw)).toBeNull();
    }
  });
});
