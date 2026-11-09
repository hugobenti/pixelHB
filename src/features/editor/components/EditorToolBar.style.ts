/**
 * Purpose:
 * Classes for the EditorToolBar: a bottom bar on phones (one row, safe-area padding), the right half of the top row from `md`.
 */

export const editorToolBar = {
  bar: "flex items-center justify-between gap-0.5 border-t border-line pt-2 pb-[env(safe-area-inset-bottom)] [grid-area:tools] md:justify-end md:gap-0 md:border-t-0 md:py-2",
  drawingGroup: "contents md:flex md:items-center md:gap-1 lg:gap-2",
  viewGroup: "contents md:ml-2 md:flex md:items-center md:gap-1 md:border-l md:border-line md:pl-2 lg:gap-2",
  editGroup: "contents md:ml-2 md:flex md:items-center md:border-l md:border-line md:pl-2",
  colorGroup: "flex items-center md:ml-2 md:border-l md:border-line md:pl-2",
  phoneTool: "flex min-w-0 flex-col items-center md:block",
  phoneButton: "max-md:min-h-11 max-md:min-w-11",
  phoneCaption: "text-xs leading-4 text-muted md:hidden",
  /** Pinch covers zoom on phones. */
  zoomButton: "max-md:hidden",
};
