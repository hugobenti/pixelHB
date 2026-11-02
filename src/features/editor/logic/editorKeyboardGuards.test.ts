import { describe, expect, it } from "vitest";

import {
  editorShortcutForKey,
  isTextEntryTarget,
  shouldClaimSpaceForCanvasPan,
} from "@/features/editor/logic/editorKeyboardGuards";

const key = (
  k: string,
  mods: Partial<{
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    repeat: boolean;
  }> = {}
) => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

describe("isTextEntryTarget", () => {
  it.each(["INPUT", "TEXTAREA", "SELECT", "input", "textarea", "select"])(
    "treats <%s> as text entry",
    (tagName) => {
      expect(isTextEntryTarget({ tagName })).toBe(true);
    }
  );

  it("treats contenteditable elements as text entry", () => {
    expect(isTextEntryTarget({ tagName: "DIV", isContentEditable: true })).toBe(
      true
    );
  });

  it("does not treat buttons, plain elements or null as text entry", () => {
    expect(isTextEntryTarget({ tagName: "BUTTON" })).toBe(false);
    expect(isTextEntryTarget({ tagName: "DIV", isContentEditable: false })).toBe(
      false
    );
    expect(isTextEntryTarget(null)).toBe(false);
    expect(isTextEntryTarget({})).toBe(false);
  });
});

describe("editorShortcutForKey", () => {
  it("maps bare g to the grid toggle", () => {
    expect(editorShortcutForKey(key("g"), false)).toBe("toggleGrid");
    expect(editorShortcutForKey(key("G"), false)).toBe("toggleGrid");
  });

  it("ignores g with a modifier", () => {
    expect(editorShortcutForKey(key("g", { ctrlKey: true }), false)).toBeNull();
    expect(editorShortcutForKey(key("g", { metaKey: true }), false)).toBeNull();
    expect(editorShortcutForKey(key("g", { altKey: true }), false)).toBeNull();
  });

  it("maps bare e to the eraser toggle", () => {
    expect(editorShortcutForKey(key("e"), false)).toBe("toggleEraser");
    expect(editorShortcutForKey(key("E"), false)).toBe("toggleEraser");
  });

  it("ignores e with Ctrl, Cmd or Alt, and while typing in a text field", () => {
    expect(editorShortcutForKey(key("e", { ctrlKey: true }), false)).toBeNull();
    expect(editorShortcutForKey(key("e", { metaKey: true }), false)).toBeNull();
    expect(editorShortcutForKey(key("e", { altKey: true }), false)).toBeNull();
    expect(editorShortcutForKey(key("e"), true)).toBeNull();
  });

  it("maps bare x to the slot switch", () => {
    expect(editorShortcutForKey(key("x"), false)).toBe("switchSlot");
    expect(editorShortcutForKey(key("X"), false)).toBe("switchSlot");
  });

  it("leaves Ctrl/Cmd/Alt+X to the browser (cut) and ignores x in a text field", () => {
    expect(editorShortcutForKey(key("x", { ctrlKey: true }), false)).toBeNull();
    expect(editorShortcutForKey(key("x", { metaKey: true }), false)).toBeNull();
    expect(editorShortcutForKey(key("x", { altKey: true }), false)).toBeNull();
    expect(editorShortcutForKey(key("x"), true)).toBeNull();
  });

  it("maps b, f and i to the brush, bucket and picker", () => {
    expect(editorShortcutForKey(key("b"), false)).toBe("selectBrush");
    expect(editorShortcutForKey(key("B"), false)).toBe("selectBrush");
    expect(editorShortcutForKey(key("f"), false)).toBe("toggleBucket");
    expect(editorShortcutForKey(key("i"), false)).toBe("togglePicker");
  });

  it("maps + and = to zoom in and - to zoom out, with or without Shift", () => {
    expect(editorShortcutForKey(key("+", { shiftKey: true }), false)).toBe("zoomIn");
    expect(editorShortcutForKey(key("+"), false)).toBe("zoomIn");
    expect(editorShortcutForKey(key("="), false)).toBe("zoomIn");
    expect(editorShortcutForKey(key("-"), false)).toBe("zoomOut");
    expect(editorShortcutForKey(key("-", { shiftKey: true }), false)).toBe("zoomOut");
  });

  it("leaves Ctrl/Cmd/Alt combos and text fields alone for the new keys", () => {
    for (const k of ["b", "f", "i", "+", "=", "-"]) {
      expect(editorShortcutForKey(key(k, { ctrlKey: true }), false)).toBeNull();
      expect(editorShortcutForKey(key(k, { metaKey: true }), false)).toBeNull();
      expect(editorShortcutForKey(key(k, { altKey: true }), false)).toBeNull();
      expect(editorShortcutForKey(key(k), true)).toBeNull();
    }
  });

  it("ignores auto-repeat of the bare-letter shortcuts", () => {
    for (const letter of ["g", "e", "x", "b", "f", "i"]) {
      expect(editorShortcutForKey(key(letter, { repeat: true }), false)).toBeNull();
    }
  });

  it("lets the zoom keys auto-repeat so holding + or - keeps zooming", () => {
    expect(editorShortcutForKey(key("+", { repeat: true }), false)).toBe("zoomIn");
    expect(editorShortcutForKey(key("=", { repeat: true }), false)).toBe("zoomIn");
    expect(editorShortcutForKey(key("-", { repeat: true }), false)).toBe("zoomOut");
  });

  it("maps Ctrl/Cmd+Z to undo and with Shift to redo", () => {
    expect(editorShortcutForKey(key("z", { ctrlKey: true }), false)).toBe("undo");
    expect(editorShortcutForKey(key("z", { metaKey: true }), false)).toBe("undo");
    expect(
      editorShortcutForKey(key("Z", { metaKey: true, shiftKey: true }), false)
    ).toBe("redo");
  });

  it("never claims keys while focus is in a text field", () => {
    expect(editorShortcutForKey(key("g"), true)).toBeNull();
    expect(editorShortcutForKey(key("z", { ctrlKey: true }), true)).toBeNull();
    expect(
      editorShortcutForKey(key("z", { metaKey: true, shiftKey: true }), true)
    ).toBeNull();
  });

  it("leaves scrolling keys alone", () => {
    for (const k of [" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"]) {
      expect(editorShortcutForKey(key(k), false)).toBeNull();
    }
  });
});

describe("shouldClaimSpaceForCanvasPan", () => {
  const canvas = { tagName: "DIV" };
  const body = { tagName: "BODY" };
  const base = { code: "Space", target: body, canvas, pointerOverCanvas: false };

  it("claims Space on the page while the pointer is over the canvas viewport", () => {
    expect(shouldClaimSpaceForCanvasPan({ ...base, pointerOverCanvas: true })).toBe(
      true
    );
    expect(
      shouldClaimSpaceForCanvasPan({
        ...base,
        target: { tagName: "HTML" },
        pointerOverCanvas: true,
      })
    ).toBe(true);
  });

  it("claims Space while the canvas viewport itself has focus", () => {
    expect(shouldClaimSpaceForCanvasPan({ ...base, target: canvas })).toBe(true);
  });

  it("leaves Space to the page outside the canvas context", () => {
    expect(shouldClaimSpaceForCanvasPan(base)).toBe(false);
    expect(shouldClaimSpaceForCanvasPan({ ...base, canvas: null })).toBe(false);
  });

  it("never claims Space from text fields or interactive controls", () => {
    for (const target of [
      { tagName: "INPUT" },
      { tagName: "TEXTAREA" },
      { tagName: "SELECT" },
      { tagName: "DIV", isContentEditable: true },
      { tagName: "BUTTON" },
      { tagName: "A" },
      { tagName: "DIV" },
    ]) {
      expect(
        shouldClaimSpaceForCanvasPan({ ...base, target, pointerOverCanvas: true })
      ).toBe(false);
    }
  });

  it("ignores keys other than Space", () => {
    expect(
      shouldClaimSpaceForCanvasPan({
        ...base,
        code: "ArrowDown",
        pointerOverCanvas: true,
      })
    ).toBe(false);
    expect(
      shouldClaimSpaceForCanvasPan({ ...base, code: "PageDown", target: canvas })
    ).toBe(false);
  });
});
