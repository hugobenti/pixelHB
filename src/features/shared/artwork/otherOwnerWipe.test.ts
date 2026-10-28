import { expect, it } from "vitest";

import { planOtherOwnerWipe } from "./otherOwnerWipe";
import type { IOwnedRowBrief } from "./otherOwnerWipe.type";

const row = (
  id: string,
  ownerId: string | null,
  state: IOwnedRowBrief["state"],
): IOwnedRowBrief => ({
  id,
  ownerId,
  state,
});

it("returns only synced rows of other string owners", () => {
  const rows = [
    row("mine", "u1", "synced"),
    row("theirs", "u2", "synced"),
    row("theirs-dirty", "u2", "dirty"),
    row("theirs-big", "u2", "tooLarge"),
    row("theirs-local", "u2", "local"),
    row("unowned", null, "synced"),
    row("third", "u3", "synced"),
  ];
  expect(planOtherOwnerWipe("u1", rows, new Set())).toEqual(["theirs", "third"]);
});

it("keeps a row whose id still has a tombstone", () => {
  const rows = [row("a", "u2", "synced"), row("b", "u2", "synced")];
  expect(planOtherOwnerWipe("u1", rows, new Set(["a"]))).toEqual(["b"]);
});

it("plans nothing when there are no rows", () => {
  expect(planOtherOwnerWipe("u1", [], new Set())).toEqual([]);
});
