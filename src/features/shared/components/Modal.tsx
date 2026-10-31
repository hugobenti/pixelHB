/**
 * Purpose:
 * Accessible modal skeleton: dimmed backdrop, panel labelled by its built-in heading, close button,
 * content, optional footer actions, and an optional form wrapper; fades in and out.
 *
 * Notes:
 * On phones the panel is an edge-to-edge bottom sheet; from `sm` up it is a centered card.
 * Mark a field with `data-autofocus` to focus it on open instead of the close button.
 */
"use client";

import { shared } from "@/content/shared";
import { IconButton } from "@/features/shared/components/IconButton";
import { PUBLIC_ICONS } from "@/features/shared/constants/publicIcons";
import { cx } from "@/features/shared/utils/cx";
import { modal } from "./Modal.style";
import type { IModalProps } from "./Modal.type";
import { useModal } from "./useModal";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  onSubmit,
  size = "md",
  layer = "default",
  dim = "blur",
  closeOnBackdrop = true,
  closeOnEscape = true,
  panelProps,
}: IModalProps) {
  const { titleId, panelRef, mounted, entered, onBackdropMouseDown } = useModal({
    open,
    closeOnEscape,
    onClose,
  });

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cx(
        modal.overlay,
        modal.layer[layer],
        modal.dim[dim],
        entered ? modal.overlayState.open : modal.overlayState.closed,
      )}
      inert={!open}
    >
      {closeOnBackdrop ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={shared.modal.backdropLabel}
          className={modal.backdrop}
          onMouseDown={onBackdropMouseDown}
        />
      ) : null}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          modal.panel,
          modal.size[size],
          entered ? modal.panelState.open : modal.panelState.closed,
        )}
        {...panelProps}
      >
        <div className={modal.header}>
          <h2 id={titleId} className={modal.heading}>
            {title}
          </h2>
          <IconButton
            icon={PUBLIC_ICONS.xMark}
            label={shared.actions.close}
            className={modal.closeButton}
            onClick={onClose}
          />
        </div>
        {onSubmit ? (
          <form className={modal.form} onSubmit={onSubmit}>
            {children}
            {footer ? <div className={modal.footer}>{footer}</div> : null}
          </form>
        ) : (
          <>
            {children}
            {footer ? <div className={modal.footer}>{footer}</div> : null}
          </>
        )}
      </div>
    </div>
  );
}
