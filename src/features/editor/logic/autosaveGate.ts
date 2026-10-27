/**
 * Purpose:
 * Pure change gate for editor autosave: reports an unsaved edit only when the paint or history
 * revision moved since the last persist (or since mount), so opening and leaving writes nothing.
 */
import type { IAutosaveGate, IAutosaveRevisions } from "./autosaveGate.type";

export function createAutosaveGate(initial: IAutosaveRevisions): IAutosaveGate {
  let latest = initial;
  let persisted = initial;
  return {
    observe(revisions) {
      latest = revisions;
    },
    takePending() {
      const pending =
        latest.paintRevision !== persisted.paintRevision ||
        latest.historyRevision !== persisted.historyRevision;
      persisted = latest;
      return pending;
    },
  };
}
