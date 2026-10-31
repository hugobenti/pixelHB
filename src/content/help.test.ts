import { describe, expect, it } from "vitest";

import { shouldStartPickHold } from "@/features/editor/logic/colorPicker";
import { editorShortcutForKey, shouldClaimSpaceForCanvasPan } from "@/features/editor/logic/editorKeyboardGuards";
import type { IShortcutKeyLike } from "@/features/editor/logic/editorKeyboardGuards.type";
import { KEYBOARD_PAN_FAST_STEP_PX, keyboardPanDelta } from "@/features/editor/logic/keyboardPan";

import { help } from "./help";

function eventFor(combo: { key: string; mod?: boolean; shift?: boolean }, modifier: "ctrlKey" | "metaKey"): IShortcutKeyLike {
  return {
    key: combo.key,
    ctrlKey: modifier === "ctrlKey" && Boolean(combo.mod),
    metaKey: modifier === "metaKey" && Boolean(combo.mod),
    altKey: false,
    shiftKey: Boolean(combo.shift),
  };
}

describe("help shortcuts match the editor's key handling", () => {
  it("documents every effect", () => {
    expect(help.shortcuts.map((s) => s.effect).sort()).toEqual(
      ["altPick", "arrowPan", "redo", "spacePan", "toggleEraser", "toggleGrid", "undo"],
    );
  });

  for (const shortcut of help.shortcuts) {
    it(`${shortcut.action} (${shortcut.effect})`, () => {
      switch (shortcut.effect) {
        case "undo":
        case "redo":
        case "toggleGrid":
        case "toggleEraser":
          for (const modifier of ["ctrlKey", "metaKey"] as const) {
            expect(editorShortcutForKey(eventFor(shortcut.combo, modifier), false)).toBe(shortcut.effect);
          }
          break;
        case "spacePan":
          expect(
            shouldClaimSpaceForCanvasPan({
              code: "Space",
              target: { tagName: "BODY" },
              canvas: null,
              pointerOverCanvas: true,
            }),
          ).toBe(true);
          break;
        case "arrowPan":
          for (const arrow of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]) {
            expect(keyboardPanDelta(arrow, false)).not.toBeNull();
          }
          expect(keyboardPanDelta("ArrowLeft", true)?.dx).toBe(-KEYBOARD_PAN_FAST_STEP_PX);
          expect(KEYBOARD_PAN_FAST_STEP_PX).toBe(128);
          break;
        case "altPick":
          expect(
            shouldStartPickHold({
              armed: false,
              altKey: true,
              button: 0,
              pointerType: "mouse",
              touchCount: 0,
              panDeferred: false,
            }),
          ).toBe(true);
          break;
      }
    });
  }
});
