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

/** Editor shortcut for a key press, or null when the key must be left to the browser. */
export function editorShortcutForKey(
  e: IShortcutKeyLike,
  targetIsTextEntry: boolean
): TEditorShortcut | null {
  if (targetIsTextEntry) {
    return null;
  }
  const lower = e.key.toLowerCase();
  if (lower === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    return "toggleGrid";
  }
  if (lower === "e" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    return "toggleEraser";
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
