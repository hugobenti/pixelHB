/**
 * Purpose:
 * Modal behavior: the heading id for `aria-labelledby`, mount and fade state (the panel stays mounted
 * until its exit fade ends), focus trap with an optional `data-autofocus` start field (the panel itself on touch, so the keyboard stays down), and Escape.
 */
"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";

import { useFocusTrap } from "@/features/shared/hooks/useFocusTrap";
import { shouldAutofocusTarget } from "@/features/shared/logic/modalAutofocus";
import type { IUseModalInput } from "./Modal.type";

/** Matches `duration-200` on the overlay and panel in Modal.style.ts. */
const MODAL_MOTION_MS = 200;
/** Element inside the panel that receives focus on open instead of the first focusable (the close button). */
const AUTOFOCUS_SELECTOR = "[data-autofocus]";
const COARSE_POINTER_QUERY = "(pointer: coarse)";

export function useModal({ open, closeOnEscape, onClose }: IUseModalInput) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);

  if (open && !mounted) {
    setMounted(true);
  }
  if (!open && entered) {
    setEntered(false);
  }

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) {
      return;
    }
    const target = panelRef.current?.querySelector<HTMLElement>(AUTOFOCUS_SELECTOR);
    const isTextEntry =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable === true;
    const coarsePointer = window.matchMedia(COARSE_POINTER_QUERY).matches;
    if (!shouldAutofocusTarget({ coarsePointer, isTextEntry })) {
      panelRef.current?.focus();
      return;
    }
    target?.focus();
    if (target instanceof HTMLInputElement) {
      target.select();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      let frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => setEntered(true));
      });
      return () => window.cancelAnimationFrame(frame);
    }
    if (!mounted) {
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), MODAL_MOTION_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  useEffect(() => {
    if (!open || !closeOnEscape) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape, onClose]);

  /** Keeps the press from moving focus onto the backdrop, so the trap can restore it to the opener. */
  const onBackdropMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    onClose();
  };

  return { titleId, panelRef, mounted, entered, onBackdropMouseDown };
}
