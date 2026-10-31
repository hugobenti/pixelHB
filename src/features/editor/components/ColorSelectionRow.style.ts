/**
 * Purpose:
 * Classes for the ColorSelectionRow: row frame, horizontal swatch scroller, swatch list and the pinned edit button.
 */

export const colorSelectionRow = {
  row: "flex w-full min-w-0 items-center gap-2 border-y border-line py-2 [grid-area:palette] sm:border-t-0",
  scroller:
    "flex min-w-0 flex-1 items-center -ml-1 overflow-x-auto scroll-px-1 px-1 py-1 [scrollbar-width:thin]",
  /** Each selection ring reaches 4px past its swatch (2px ring + 2px offset); 10px keeps neighbours apart from `sm`; phones use 8px so another swatch shows. */
  swatchList: "flex items-center gap-2 sm:gap-2.5",
  /** Flex item, not list-item: drops the line-box gap under each swatch so it lines up with the button. */
  swatchItem: "flex",
  /** Extends the outline Button. */
  editButton:
    "shrink-0 touch-manipulation gap-2 px-2.5 py-2 text-sm whitespace-nowrap pointer-coarse:min-w-11 sm:px-3",
  /** Icon only below `sm`, so more swatches fit. */
  editLabel: "sr-only sm:not-sr-only",
};
