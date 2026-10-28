/**
 * Purpose:
 * Classes for the Button primitive: base, size and variant maps (icon-only buttons use IconButton), and the ghost step-button adjustment.
 */

import { focusRing } from "@/features/shared/components/focus.style";
import { cx } from "@/features/shared/utils/cx";

export const button = {
  base: cx(
    "inline-flex touch-manipulation items-center justify-center font-medium transition-colors",
    focusRing,
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  ),
  size: {
    default: "min-h-10 rounded-lg px-3 py-2 text-sm pointer-coarse:min-h-11",
    step: "h-9 min-w-9 rounded-md text-lg leading-none font-semibold disabled:cursor-not-allowed",
  },
  variant: {
    primary: "bg-accent text-on-accent hover:bg-accent-hover",
    ghost: "bg-transparent text-fg-soft hover:bg-surface-muted",
    danger: "bg-danger text-on-danger hover:bg-danger-hover",
    outline:
      "border border-control-border bg-surface text-fg-soft shadow-sm hover:bg-surface-subtle active:bg-surface-muted",
  },
  /** Ghost variant at step size: keeps the hover tint and dims less when disabled. */
  ghostStep: "hover:bg-surface-muted disabled:opacity-40",
};
