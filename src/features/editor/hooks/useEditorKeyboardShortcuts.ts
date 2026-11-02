/**
 * Purpose:
 * Global key bindings for the pixel editor (toggle grid, toggle eraser, switch color slot, undo/redo).
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
      } else if (shortcut === "redo") {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTogglePixelGrid, onToggleEraser, onSwitchSlot, undo, redo]);
}
