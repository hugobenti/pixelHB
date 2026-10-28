import { describe, expect, it } from "vitest";

import { SESSION_MAX_AGE_SECONDS } from "../sessionLifetime";
import { parseAccountHint, serializeAccountHint, toAccountHint } from "./accountHint";

const user = { id: "g1", name: "Ada", email: "ada@example.com", image: "https://x/y.png" };
const NOW = 1_700_000_000_000;
const MAX_MS = SESSION_MAX_AGE_SECONDS * 1000;

describe("account hint", () => {
  it("keeps id, name, image and save time, never the email", () => {
    const hint = toAccountHint(user, NOW);
    expect(hint).toEqual({ id: "g1", name: "Ada", image: "https://x/y.png", savedAt: NOW });
    expect(serializeAccountHint(hint)).not.toContain("ada@example.com");
  });
  it("round-trips", () => {
    const hint = toAccountHint(user, NOW);
    expect(parseAccountHint(serializeAccountHint(hint), NOW + 1000)).toEqual(hint);
  });
  it("fills missing name and image", () => {
    expect(parseAccountHint(`{"id":"g1","savedAt":${NOW}}`, NOW)).toEqual({
      id: "g1",
      name: "",
      image: null,
      savedAt: NOW,
    });
  });
  it("is valid up to 7 days after it was saved and ignored after that", () => {
    const raw = serializeAccountHint(toAccountHint(user, NOW));
    expect(parseAccountHint(raw, NOW + MAX_MS)).not.toBeNull();
    expect(parseAccountHint(raw, NOW + MAX_MS + 1)).toBeNull();
  });
  it("ignores a hint saved in the future (the clock moved) or without a save time", () => {
    const raw = serializeAccountHint(toAccountHint(user, NOW));
    expect(parseAccountHint(raw, NOW - 120_000)).toBeNull();
    expect(parseAccountHint('{"id":"g1","name":"Ada"}', NOW)).toBeNull();
    expect(parseAccountHint('{"id":"g1","savedAt":"x"}', NOW)).toBeNull();
  });
  it("rejects anything without a non-empty string id", () => {
    for (const raw of [null, "", "nope", "null", "[]", "3", '{"id":""}', '{"id":3}', "{}"]) {
      expect(parseAccountHint(raw, NOW)).toBeNull();
    }
  });
});
