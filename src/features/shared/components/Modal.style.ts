/**
 * Purpose:
 * Classes for the shared Modal skeleton: overlay (layer, dimming, fade), panel (one padding for every
 * size, bottom sheet on phones), header with title and close button, and the footer action row.
 *
 * Notes:
 * The fade duration (`duration-200`) matches `MODAL_MOTION_MS` in useModal.ts.
 */

import { cx } from "@/features/shared/utils/cx";

export const modal = {
  overlay: cx(
    "fixed inset-0 flex items-end justify-center sm:items-center sm:p-4",
    "transition-opacity duration-200 ease-out",
  ),
  layer: {
    default: "z-50",
    elevated: "z-[60]",
  },
  dim: {
    blur: "bg-scrim/40 backdrop-blur-sm",
    scrim: "bg-scrim/40",
    none: "",
  },
  overlayState: {
    open: "opacity-100",
    closed: "opacity-0",
  },
  /** Full-overlay dismiss target behind the panel (pointer only; Escape covers keyboard). */
  backdrop: "absolute inset-0 cursor-default",
  panel: cx(
    "relative flex max-h-[85dvh] w-full flex-col gap-4 overflow-y-auto overscroll-contain bg-surface p-5 shadow-xl outline-none",
    "rounded-t-xl border-t border-line pb-[max(1.25rem,env(safe-area-inset-bottom))]",
    "sm:rounded-xl sm:border sm:pb-5",
    "transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-opacity",
  ),
  panelState: {
    open: "translate-y-0 opacity-100",
    closed: "translate-y-2 opacity-0 motion-reduce:translate-y-0",
  },
  size: {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
  },
  header: "flex items-center justify-between gap-3",
  heading: "min-w-0 truncate text-base font-semibold text-fg",
  closeButton: "-my-2 -mr-2",
  /** Wraps the content and footer when the dialog is a form, keeping the panel rhythm. */
  form: "flex flex-col gap-4",
  footer: "flex flex-wrap justify-end gap-2 pt-1",
};
