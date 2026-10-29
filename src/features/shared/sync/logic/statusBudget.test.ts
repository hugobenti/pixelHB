import { describe, expect, it } from "vitest";

import { ABSENT_RECHECK_MS, MAX_STATUS_CALLS_PER_PASS, planStatusChecks } from "./statusBudget";

const cand = (id: string, updatedAt: number) => ({ id, updatedAt });

describe("planStatusChecks", () => {
  it("asks about everything, newest edit first, when the budget allows", () => {
    expect(planStatusChecks([cand("a", 1), cand("b", 3), cand("c", 2)], new Map(), 0)).toEqual({
      check: ["b", "c", "a"],
      remembered: [],
      leftOver: 0,
    });
  });

  it("breaks ties by id", () => {
    expect(planStatusChecks([cand("b", 1), cand("a", 1)], new Map(), 0).check).toEqual(["a", "b"]);
  });

  it("caps the calls per pass and reports what is left for the next one", () => {
    const many = Array.from({ length: MAX_STATUS_CALLS_PER_PASS + 5 }, (_, i) => cand(`r${i}`, i));
    const plan = planStatusChecks(many, new Map(), 0);
    expect(plan.check).toHaveLength(MAX_STATUS_CALLS_PER_PASS);
    expect(plan.check[0]).toBe(`r${MAX_STATUS_CALLS_PER_PASS + 4}`);
    expect(plan.leftOver).toBe(5);
  });

  it("does not ask again about an artwork that was absent within the recheck window, and does not spend budget on it", () => {
    const absent = new Map([["gone", 1000 + ABSENT_RECHECK_MS]]);
    const plan = planStatusChecks([cand("gone", 9), cand("new", 1)], absent, 1000);
    expect(plan).toEqual({ remembered: ["gone"], check: ["new"], leftOver: 0 });
  });

  it("asks again once the window has passed", () => {
    const absent = new Map([["gone", 1000]]);
    expect(planStatusChecks([cand("gone", 9)], absent, 1000).check).toEqual(["gone"]);
  });
});
