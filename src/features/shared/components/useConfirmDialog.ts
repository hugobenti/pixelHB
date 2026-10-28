/**
 * Purpose:
 * ConfirmDialog behavior: heading/description ids for the alertdialog, Escape that cancels, and the
 * portal target.
 *
 * Notes:
 * The dialog renders into `document.body` (client only), so a caller inside a transformed or
 * clipped container, such as a sliding drawer, still gets a full-viewport dialog on top.
 * Escape is caught in the capture phase and stopped there, so a drawer or page shortcut listening on
 * `window` underneath does not also react to it while the dialog is open.
 */
"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";

import type { IConfirmDialogProps } from "./ConfirmDialog.type";

const subscribeNever = () => () => {};

export function useConfirmDialog({ options, onCancel }: IConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const warningId = useId();
  const open = options !== null;
  const contentRef = useRef<HTMLDivElement>(null);
  const title = options?.title;
  const openedTitle = useRef<string | undefined>(undefined);
  const isClient = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  /** The same dialog moved to another step (new title): focus returns to the first action, or it would be lost on body. */
  useEffect(() => {
    const previous = openedTitle.current;
    openedTitle.current = title;
    if (previous !== undefined && title !== undefined && previous !== title) {
      contentRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
  }, [title]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onCancel]);

  return {
    open,
    contentRef,
    portalTarget: isClient ? document.body : null,
    titleId,
    descriptionId,
    warningId,
    describedBy: options?.warning ? `${descriptionId} ${warningId}` : descriptionId,
  };
}
