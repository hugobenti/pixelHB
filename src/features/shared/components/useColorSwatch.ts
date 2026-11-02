/**
 * Purpose:
 * ColorSwatch view model: 1-based title and accessible name, pressed/current state, which ring to show and which slot markers.
 */
"use client";

import { shared } from "@/content/shared";
import { colorSwatchMarkers, colorSwatchRing } from "@/features/shared/logic/colorSwatchRing";
import type { IColorSwatchView, TColorSwatchProps } from "./ColorSwatch.type";

export function useColorSwatch(props: TColorSwatchProps): IColorSwatchView {
  const n = props.index + 1;
  const ring = colorSwatchRing(props);
  const markers = colorSwatchMarkers(props);

  if (props.density === "compact") {
    return {
      title: shared.colorSwatch.compactTitle(n),
      ariaLabel: shared.colorSwatch.selectLabel(n, props.color),
      ariaPressed: props.selected,
      ariaCurrent: undefined,
      ring,
      focused: false,
      showTopLeftMarker: markers.topLeft,
      showBottomRightMarker: markers.bottomRight,
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
    showTopLeftMarker: markers.topLeft,
    showBottomRightMarker: markers.bottomRight,
  };
}
