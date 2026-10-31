/**
 * Purpose:
 * Classes for the EditorToolBar: a bottom bar on phones (one row, safe-area padding), the right half of the top row from `md`.
 */

export const editorToolBar = {
  bar: "flex items-center justify-between gap-0.5 border-t border-line pt-2 pb-[env(safe-area-inset-bottom)] [grid-area:tools] md:justify-end md:gap-1 md:border-t-0 md:py-2 lg:gap-2",
  /** Pinch covers zoom on phones. */
  zoomButton: "max-sm:hidden",
};
