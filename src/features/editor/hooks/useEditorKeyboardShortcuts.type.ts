export interface IUseEditorKeyboardShortcutsParams {
  onToggleShortcuts: () => void;
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
