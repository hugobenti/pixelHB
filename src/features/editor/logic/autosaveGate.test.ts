import { describe, expect, test } from "vitest";

import { createAutosaveGate } from "./autosaveGate";

describe("createAutosaveGate", () => {
  test("opening and leaving without an edit never persists", () => {
    const gate = createAutosaveGate({ paintRevision: 0, historyRevision: 0 });
    gate.observe({ paintRevision: 0, historyRevision: 0 }); // re-render / StrictMode effect re-run
    expect(gate.takePending()).toBe(false);
  });

  test("a paint edit persists once; the following flushes are no-ops", () => {
    const gate = createAutosaveGate({ paintRevision: 0, historyRevision: 0 });
    gate.observe({ paintRevision: 1, historyRevision: 0 });
    expect(gate.takePending()).toBe(true);
    expect(gate.takePending()).toBe(false); // pagehide after the debounced save
  });

  test("a history change (undo/redo/stroke commit) counts as an edit", () => {
    const gate = createAutosaveGate({ paintRevision: 3, historyRevision: 5 });
    gate.observe({ paintRevision: 3, historyRevision: 6 });
    expect(gate.takePending()).toBe(true);
  });

  test("several edits between saves persist once, and a later edit persists again", () => {
    const gate = createAutosaveGate({ paintRevision: 0, historyRevision: 0 });
    gate.observe({ paintRevision: 1, historyRevision: 0 });
    gate.observe({ paintRevision: 2, historyRevision: 1 });
    expect(gate.takePending()).toBe(true);
    gate.observe({ paintRevision: 2, historyRevision: 1 });
    expect(gate.takePending()).toBe(false);
    gate.observe({ paintRevision: 3, historyRevision: 1 });
    expect(gate.takePending()).toBe(true);
  });

  test("markPending makes the next flush retry a failed save once", () => {
    const gate = createAutosaveGate({ paintRevision: 0, historyRevision: 0 });
    gate.observe({ paintRevision: 1, historyRevision: 0 });
    expect(gate.takePending()).toBe(true);
    gate.markPending();
    expect(gate.takePending()).toBe(true);
    expect(gate.takePending()).toBe(false);
  });
});
