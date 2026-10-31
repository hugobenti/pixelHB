/**
 * Purpose:
 * Classes for the EditorToolBar: a bottom bar on phones (one row, safe-area padding), the right half of the top row from `sm`.
 */

export const editorToolBar = {
  bar: "flex items-center justify-between gap-0.5 border-t border-line pt-2 pb-[env(safe-area-inset-bottom)] [grid-area:tools] sm:justify-end sm:gap-1 sm:border-t-0 sm:py-2 lg:gap-2",
  /** Pinch covers zoom on phones. */
  zoomButton: "max-sm:hidden",
};
