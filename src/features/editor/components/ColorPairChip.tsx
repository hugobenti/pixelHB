/**
 * Purpose:
 * Toolbar button that shows the two painting colors and swaps which one the left button paints.
 *
 * Notes:
 * Neutral outline, never the accent: the active color sits in front (top-left), the other behind.
 */
"use client";

import { cx } from "@/features/shared/utils/cx";
import { colorPairChip } from "./ColorPairChip.style";
import type { IColorPairChipProps } from "./ColorPairChip.type";
import { useColorPairChip } from "./useColorPairChip";

export function ColorPairChip(props: IColorPairChipProps) {
  const { onToggle } = props;
  const { activeColor, otherColor, label, title } = useColorPairChip(props);

  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      className={colorPairChip.base}
      onClick={onToggle}
    >
      <span className={colorPairChip.stack} aria-hidden>
        <span
          className={cx(colorPairChip.square, colorPairChip.back)}
          style={{ backgroundColor: otherColor }}
        />
        <span
          className={cx(colorPairChip.square, colorPairChip.front)}
          style={{ backgroundColor: activeColor }}
        />
      </span>
    </button>
  );
}
