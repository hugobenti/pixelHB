/**
 * Purpose:
 * ColorPairChip view model: which color is in front, the other behind, and the accessible name.
 */
"use client";

import { editor } from "@/content/editor";
import type { IColorPairChipProps } from "./ColorPairChip.type";

export function useColorPairChip({
  primaryColor,
  secondaryColor,
  activeSlot,
}: IColorPairChipProps) {
  const activeColor = activeSlot === "primary" ? primaryColor : secondaryColor;
  const otherColor = activeSlot === "primary" ? secondaryColor : primaryColor;

  return {
    activeColor,
    otherColor,
    label: editor.toolbar.colors.label(activeColor, otherColor),
    title: editor.toolbar.colors.title,
  };
}
