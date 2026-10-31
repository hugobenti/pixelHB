/**
 * Purpose:
 * LayerPreview behavior: rasterize the layer at native resolution, downscale it nearest-neighbor to the
 * list thumbnail and return it as a PNG data URL ("" when no canvas is available).
 */
"use client";

import { useMemo } from "react";

import { LAYER_PREVIEW_MAX_EDGE_PX } from "@/features/editor/components/LayersDrawer/layersDrawer.constants";
import {
  layerPreviewThumbSize,
  paintLayerPixels,
} from "@/features/editor/logic/layerPreviewRaster";
import type { ILayerPreviewProps } from "./LayerPreview.type";

export function useLayerPreview({ layer, palette, width, height, revision }: ILayerPreviewProps) {
  const previewUrl = useMemo(() => {
    if (typeof document === "undefined") {
      return "";
    }
    const full = document.createElement("canvas");
    const ctx = full.getContext("2d");
    if (!ctx) {
      return "";
    }
    full.width = width;
    full.height = height;
    ctx.imageSmoothingEnabled = false;
    paintLayerPixels(ctx, layer.pixelData, palette, width, height);

    const thumbSize = layerPreviewThumbSize(width, height, LAYER_PREVIEW_MAX_EDGE_PX);
    const thumb = document.createElement("canvas");
    const tctx = thumb.getContext("2d");
    let output = full;
    if (tctx) {
      thumb.width = thumbSize.width;
      thumb.height = thumbSize.height;
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(full, 0, 0, width, height, 0, 0, thumbSize.width, thumbSize.height);
      output = thumb;
    }
    try {
      return output.toDataURL("image/png");
    } catch {
      return "";
    }
    // Keyed on the pixel buffer, which strokes often mutate in place (same ref); SortableLayerItem
    // remounts the preview on drawer open/close to pick those up; `revision` redraws it on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revision only forces a redraw
  }, [layer.pixelData, palette, width, height, revision]);

  return { previewUrl };
}
