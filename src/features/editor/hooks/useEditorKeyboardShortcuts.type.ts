export interface IUseEditorKeyboardShortcutsParams {
  onTogglePixelGrid: () => void;
  onToggleEraser: () => void;
  onSwitchSlot: () => void;
  onSelectBrush: () => void;
  onToggleBucket: () => void;
  onTogglePicker: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  undo: () => void;
  redo: () => void;
}
