/**
 * Purpose:
 * Confirmation step for destructive actions: a small alertdialog on Modal that names the target,
 * explains the consequence, and offers Cancel (focused first) and a danger-filled confirm button.
 *
 * Notes:
 * Open it with `useConfirm()`; Escape and the backdrop cancel. This is the only place the danger fill appears.
 */
"use client";

import { createPortal } from "react-dom";

import { shared } from "@/content/shared";
import { Button } from "./Button";
import { confirmDialog } from "./ConfirmDialog.style";
import type { IConfirmDialogProps } from "./ConfirmDialog.type";
import { Modal } from "./Modal";
import { useConfirmDialog } from "./useConfirmDialog";

export function ConfirmDialog(props: IConfirmDialogProps) {
  const { options, onConfirm, onCancel, extraAction, busy, children } = props;
  const { open, contentRef, portalTarget, descriptionId, warningId, describedBy } = useConfirmDialog(props);

  if (!portalTarget) return null;

  return createPortal(
    <Modal
      title={options?.title ?? ""}
      open={open}
      onClose={onCancel}
      size="sm"
      layer="elevated"
      closeOnEscape={false}
      panelProps={{ role: "alertdialog", "aria-describedby": describedBy }}
    >
      <div ref={contentRef} className={confirmDialog.content}>
        <div className={confirmDialog.text} aria-live="polite" aria-atomic="true">
          <p id={descriptionId} className={confirmDialog.body}>
            {options?.description}
          </p>
        </div>
        {children}
        {options?.warning ? (
          <p id={warningId} className={confirmDialog.warning}>
            {options.warning}
          </p>
        ) : null}
        <div className={confirmDialog.actions}>
          <Button variant="ghost" data-autofocus aria-disabled={busy || undefined} onClick={onCancel}>
            {shared.actions.cancel}
          </Button>
          {extraAction ? (
            <Button variant="outline" aria-disabled={busy || undefined} onClick={extraAction.onClick}>
              {extraAction.label}
            </Button>
          ) : null}
          <Button variant="danger" aria-disabled={busy || undefined} onClick={onConfirm}>
            {options?.confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>,
    portalTarget,
  );
}
