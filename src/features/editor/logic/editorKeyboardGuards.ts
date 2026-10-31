/**
 * Purpose:
 * Pure guards deciding which key presses the editor may claim (preventDefault) — no scroll-jacking.
 *
 * Notes:
 * Shortcuts never swallow keys while focus is in a text field; Space is only claimed for
 * Space+drag panning while the canvas viewport is hovered or focused, so page scrolling keys keep working elsewhere.
 * DOM-free (duck-typed targets) so it runs under Vitest's node environment.
 */

import type { IKeyboardTargetLike, TEditorShortcut, IShortcutKeyLike, ISpacePanClaimInput } from "./editorKeyboardGuards.type";

const TEXT_ENTRY_TAGS: Record<string, true> = {
  INPUT: true,
  TEXTAREA: true,
  SELECT: true,
};

/** True when the target is an input, textarea, select or contenteditable element. */
export function isTextEntryTarget(
  target: IKeyboardTargetLike | null | undefined
): boolean {
  if (!target) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  return TEXT_ENTRY_TAGS[target.tagName?.toUpperCase() ?? ""] === true;
}

/**
 * Keys claimed with no Ctrl, Cmd or Alt. Zoom accepts + and = (US layouts need Shift for +) and -, with or without Shift;
 * with a modifier held they stay the browser's page zoom. Toggles and tool picks fire once per press; only the zoom
 * keys `repeats` while held.
 */
const BARE_KEY_SHORTCUTS = new Map<string, { shortcut: TEditorShortcut; repeats: boolean }>([
  ["g", { shortcut: "toggleGrid", repeats: false }],
  ["e", { shortcut: "toggleEraser", repeats: false }],
  ["x", { shortcut: "switchSlot", repeats: false }],
  ["b", { shortcut: "selectBrush", repeats: false }],
  ["f", { shortcut: "toggleBucket", repeats: false }],
  ["i", { shortcut: "togglePicker", repeats: false }],
  ["+", { shortcut: "zoomIn", repeats: true }],
  ["=", { shortcut: "zoomIn", repeats: true }],
  ["-", { shortcut: "zoomOut", repeats: true }],
]);

/** Editor shortcut for a key press, or null when the key must be left to the browser. */
export function editorShortcutForKey(
  e: IShortcutKeyLike,
  targetIsTextEntry: boolean
): TEditorShortcut | null {
  if (targetIsTextEntry) {
    return null;
  }
  const lower = e.key.toLowerCase();
  const bareKey = e.ctrlKey || e.metaKey || e.altKey ? undefined : BARE_KEY_SHORTCUTS.get(lower);
  if (bareKey) {
    return e.repeat && !bareKey.repeats ? null : bareKey.shortcut;
  }
  if ((e.ctrlKey || e.metaKey) && lower === "z") {
    return e.shiftKey ? "redo" : "undo";
  }
  return null;
}

/**
 * Space may be claimed for Space+drag panning only inside the canvas context: when the viewport itself has focus,
 * or nothing is focused (body/html) while the pointer is over it. Focused controls and text fields keep Space.
 */
export function shouldClaimSpaceForCanvasPan({
  code,
  target,
  canvas,
  pointerOverCanvas,
}: ISpacePanClaimInput): boolean {
  if (code !== "Space" || !target) {
    return false;
  }
  if (canvas && target === canvas) {
    return true;
  }
  const tag = target.tagName?.toUpperCase();
  return pointerOverCanvas && (tag === "BODY" || tag === "HTML");
}
