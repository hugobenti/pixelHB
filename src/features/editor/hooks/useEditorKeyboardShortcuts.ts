/**
 * Purpose:
 * Global key bindings for the pixel editor (toggle grid, brush/eraser/bucket/picker tools, switch color slot, zoom, undo/redo).
 *
 * Notes:
 * Key → shortcut mapping lives in editorKeyboardGuards.ts: keys typed into text fields
 * (input/textarea/select/contenteditable) are never claimed, and scrolling keys are never bound.
 */
"use client";

import { useEffect } from "react";

import {
  editorShortcutForKey,
  isTextEntryTarget,
} from "@/features/editor/logic/editorKeyboardGuards";
import type { IUseEditorKeyboardShortcutsParams } from "./useEditorKeyboardShortcuts.type";

export function useEditorKeyboardShortcuts({
  onTogglePixelGrid,
  onToggleEraser,
  onSwitchSlot,
  onSelectBrush,
  onToggleBucket,
  onTogglePicker,
  onZoomIn,
  onZoomOut,
  undo,
  redo,
}: IUseEditorKeyboardShortcutsParams) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const shortcut = editorShortcutForKey(
        e,
        isTextEntryTarget(e.target as HTMLElement | null)
      );
      if (!shortcut) {
        return;
      }
      e.preventDefault();
      if (shortcut === "toggleGrid") {
        onTogglePixelGrid();
      } else if (shortcut === "toggleEraser") {
        onToggleEraser();
      } else if (shortcut === "switchSlot") {
        onSwitchSlot();
      } else if (shortcut === "selectBrush") {
        onSelectBrush();
      } else if (shortcut === "toggleBucket") {
        onToggleBucket();
      } else if (shortcut === "togglePicker") {
        onTogglePicker();
      } else if (shortcut === "zoomIn") {
        onZoomIn();
      } else if (shortcut === "zoomOut") {
        onZoomOut();
      } else if (shortcut === "redo") {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    onTogglePixelGrid,
    onToggleEraser,
    onSwitchSlot,
    onSelectBrush,
    onToggleBucket,
    onTogglePicker,
    onZoomIn,
    onZoomOut,
    undo,
    redo,
  ]);
}
