/**
 * Purpose:
 * ColorSwatch view model: 1-based title and accessible name, pressed/current state, which ring to show and which slot markers.
 */
"use client";

import { shared } from "@/content/shared";
import { colorSwatchRing } from "@/features/shared/logic/colorSwatchRing";
import type { IColorSwatchView, TColorSwatchProps } from "./ColorSwatch.type";

export function useColorSwatch(props: TColorSwatchProps): IColorSwatchView {
  const n = props.index + 1;
  const ring = colorSwatchRing(props);

  if (props.density === "compact") {
    return {
      title: shared.colorSwatch.compactTitle(n),
      ariaLabel: shared.colorSwatch.selectLabel(n, props.color),
      ariaPressed: props.selected,
      ariaCurrent: undefined,
      ring,
      focused: false,
      showPrimaryMarker: false,
      showSecondaryMarker: false,
    };
  }

  return {
    title: shared.colorSwatch.comfortableTitle(n),
    ariaLabel: shared.colorSwatch.selectLabel(n, props.color, {
      primary: props.isPrimary,
      secondary: props.isSecondary,
    }),
    ariaPressed: undefined,
    ariaCurrent: props.isFocused ? "true" : undefined,
    ring,
    focused: props.isFocused,
    showPrimaryMarker: props.isPrimary,
    showSecondaryMarker: props.isSecondary,
  };
}
