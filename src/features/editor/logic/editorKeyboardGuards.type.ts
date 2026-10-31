/** Minimal shape of a keyboard event target needed to detect text entry. */
export interface IKeyboardTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
}

export type TEditorShortcut = "toggleGrid" | "toggleEraser" | "undo" | "redo";

export interface IShortcutKeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export interface ISpacePanClaimInput {
  code: string;
  /** Keyboard event target (the focused element, or body when nothing is focused). */
  target: IKeyboardTargetLike | null | undefined;
  /** The canvas viewport element, if mounted. */
  canvas: IKeyboardTargetLike | null | undefined;
  pointerOverCanvas: boolean;
}
