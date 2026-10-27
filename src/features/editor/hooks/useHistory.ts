/**
 * Purpose:
 * Undo/redo stacks over atomic commands: pixel deltas and palette-color removals (no full-buffer snapshots).
 *
 * Notes:
 * Deltas target layer IDs so undo/redo can mutate the correct per-layer pixel buffer. A command's
 * `onApplied` callback updates React state (palette, color slots) after its buffers change.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  applyHistoryCommand,
  isEmptyHistoryCommand,
} from "@/features/editor/logic/historyCommands";
import { discardRedoStack } from "@/features/editor/logic/historyStacks";
import type { IHistoryCommand, THistoryDirection } from "@/features/editor/types/editor.type";
import type { IUseHistoryParams } from "./useHistory.type";

export function useHistory({ documentKey, getDocument }: IUseHistoryParams) {
  const getDocumentRef = useRef(getDocument);
  useEffect(() => {
    getDocumentRef.current = getDocument;
  }, [getDocument]);

  const applyToDocument = useCallback((cmd: IHistoryCommand, direction: THistoryDirection) => {
    const { layers, palette } = getDocumentRef.current();
    applyHistoryCommand(cmd, direction, layers, palette.length);
  }, []);

  const undoStack = useRef<IHistoryCommand[]>([]);
  const redoStack = useRef<IHistoryCommand[]>([]);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
    setHistoryRevision((r) => r + 1);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      undoStack.current = [];
      redoStack.current = [];
      setCanUndo(false);
      setCanRedo(false);
    });
  }, [documentKey]);

  const pushCommand = useCallback(
    (cmd: IHistoryCommand) => {
      if (isEmptyHistoryCommand(cmd)) {
        return;
      }
      undoStack.current.push(cmd);
      redoStack.current = [];
      syncFlags();
    },
    [syncFlags],
  );
  const discardRedo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    discardRedoStack(redoStack.current);
    syncFlags();
  }, [syncFlags]);

  const undo = useCallback(() => {
    const cmd = undoStack.current.pop();
    if (!cmd) {
      return;
    }
    applyToDocument(cmd, "undo");
    cmd.onApplied?.("undo");
    redoStack.current.push(cmd);
    syncFlags();
  }, [applyToDocument, syncFlags]);

  /** Undoes `cmd` only while it is still the latest change (e.g. an Undo toast after later edits). */
  const undoCommand = useCallback(
    (cmd: IHistoryCommand) => {
      if (undoStack.current[undoStack.current.length - 1] === cmd) {
        undo();
      }
    },
    [undo],
  );

  const redo = useCallback(() => {
    const cmd = redoStack.current.pop();
    if (!cmd) {
      return;
    }
    applyToDocument(cmd, "redo");
    cmd.onApplied?.("redo");
    undoStack.current.push(cmd);
    syncFlags();
  }, [applyToDocument, syncFlags]);

  return {
    pushCommand,
    discardRedo,
    undo,
    undoCommand,
    redo,
    canUndo,
    canRedo,
    historyRevision,
  };
}
