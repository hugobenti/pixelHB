/**
 * Purpose:
 * Clickable color chip for dense palettes (editor strip or modal grid); density controls footprint.
 */
"use client";

import { cx } from "@/features/shared/utils/cx";
import { colorSwatch } from "./ColorSwatch.style";
import type { TColorSwatchProps } from "./ColorSwatch.type";
import { useColorSwatch } from "./useColorSwatch";

export function ColorSwatch(props: TColorSwatchProps) {
  const { color, density, onClick } = props;
  const {
    title,
    ariaLabel,
    ariaPressed,
    ariaCurrent,
    ring,
    focused,
    showTopLeftMarker,
    showBottomRightMarker,
  } = useColorSwatch(props);

  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-current={ariaCurrent}
      className={cx(
        colorSwatch.density[density],
        colorSwatch.ring[ring],
        focused && colorSwatch.focused,
      )}
      style={{ backgroundColor: color }}
      onClick={onClick}
    >
      {showTopLeftMarker ? <span aria-hidden className={colorSwatch.marker.topLeft} /> : null}
      {showBottomRightMarker ? <span aria-hidden className={colorSwatch.marker.bottomRight} /> : null}
    </button>
  );
}
