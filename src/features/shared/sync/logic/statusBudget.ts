/**
 * Purpose:
 * Decides which removal candidates get a Drive status request in this pass.
 *
 * Notes:
 * A status request is a Drive query per artwork, so a pass asks for at most
 * `MAX_STATUS_CALLS_PER_PASS`, newest local edit first; the rest wait for the next pass. An artwork
 * whose last answer was `absent` is not asked again for `ABSENT_RECHECK_MS`: the answer rarely
 * changes, and a gallery of ghosts must not cost a request per ghost on every pass.
 */
import type { IStatusPlan, IStatusCandidate } from "./statusBudget.type";

export const MAX_STATUS_CALLS_PER_PASS = 25;
export const ABSENT_RECHECK_MS = 10 * 60_000;

export function planStatusChecks(
  candidates: readonly IStatusCandidate[],
  absentUntil: ReadonlyMap<string, number>,
  nowMs: number,
): IStatusPlan {
  const ordered = [...candidates].sort(
    (a, b) => b.updatedAt - a.updatedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  const remembered: string[] = [];
  const due: string[] = [];
  for (const { id } of ordered) {
    if ((absentUntil.get(id) ?? 0) > nowMs) remembered.push(id);
    else due.push(id);
  }
  return {
    remembered,
    check: due.slice(0, MAX_STATUS_CALLS_PER_PASS),
    leftOver: Math.max(0, due.length - MAX_STATUS_CALLS_PER_PASS),
  };
}
