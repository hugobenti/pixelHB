/**
 * Purpose:
 * Single horizontal row: scrollable palette swatches, then an edit control pinned at the row end.
 */
"use client";

import { editor } from "@/content/editor";
import { Button } from "@/features/shared/components/Button";
import { ColorSwatch } from "@/features/shared/components/ColorSwatch";
import { colorSelectionRow } from "./ColorSelectionRow.style";
import type { IColorSelectionRowProps } from "./ColorSelectionRow.type";
import { useColorSelectionRow } from "./useColorSelectionRow";

export function ColorSelectionRow(props: IColorSelectionRowProps) {
  const { palette, primaryIndex, secondaryIndex, activeSlot, onSwatchPick, onOpenPaletteModal } = props;
  const { focusedIndex, scrollerRef } = useColorSelectionRow(props);

  return (
    <div className={colorSelectionRow.row}>
      <div
        ref={scrollerRef}
        className={colorSelectionRow.scroller}
        role="group"
        aria-label={editor.paletteRow.groupLabel}
      >
        <ul className={colorSelectionRow.swatchList}>
          {palette.map((color, index) => (
            <li key={index} className={colorSelectionRow.swatchItem}>
              <ColorSwatch
                density="comfortable"
                color={color}
                index={index}
                isPrimary={index === primaryIndex}
                isSecondary={index === secondaryIndex}
                activeSlot={activeSlot}
                isFocused={index === focusedIndex}
                onClick={() => onSwatchPick(index)}
              />
            </li>
          ))}
        </ul>
      </div>
      <Button
        type="button"
        variant="outline"
        className={colorSelectionRow.editButton}
        onClick={onOpenPaletteModal}
      >
        {editor.paletteRow.edit}
      </Button>
    </div>
  );
}
