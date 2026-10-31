/**
 * Purpose:
 * ActiveLayerChip view model: the accessible name that announces the active layer.
 */
"use client";

import { editor } from "@/content/editor";
import type { IActiveLayerChipProps } from "./ActiveLayerChip.type";

export function useActiveLayerChip({ layer }: IActiveLayerChipProps) {
  return { label: editor.toolbar.layers.chipLabel(layer.name) };
}
