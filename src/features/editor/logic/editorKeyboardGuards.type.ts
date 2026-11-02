/** Minimal shape of a keyboard event target needed to detect text entry. */
export interface IKeyboardTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
}

export type TEditorShortcut =
  | "toggleGrid"
  | "toggleEraser"
  | "switchSlot"
  | "selectBrush"
  | "toggleBucket"
  | "togglePicker"
  | "zoomIn"
  | "zoomOut"
  | "undo"
  | "redo";

export interface IShortcutKeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  /** True for auto-repeat keydowns while the key is held. */
  repeat?: boolean;
}

export interface ISpacePanClaimInput {
  code: string;
  /** Keyboard event target (the focused element, or body when nothing is focused). */
  target: IKeyboardTargetLike | null | undefined;
  /** The canvas viewport element, if mounted. */
  canvas: IKeyboardTargetLike | null | undefined;
  pointerOverCanvas: boolean;
}
