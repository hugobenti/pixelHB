/**
 * Purpose:
 * Pointer-driven painting with window-level drag tracking and stroke delta recording.
 *
 * Notes:
 * Touch contacts are counted only via touchPointersRef (useEditorPointerContacts). When a second touch
 * lands, the stroke ends immediately. Draw permission is represented by painting + activePaintingPointerId:
 * no active stroke until pointer down with a valid gesture; cleared on up/cancel or multi-touch.
 * Painting on a hidden active layer is ignored; parent may toast via `onHiddenActiveLayerPaintAttempt`.
 * Bucket mode flood-fills using the visible composite color (all visible layers), with 4-way connectivity.
 */
"use client";
import { useEffect, useRef } from "react";

import { screenToWorldCoordinates } from "@/features/editor/logic/coordinateMath";
import { mergeStrokeDeltas } from "@/features/editor/logic/mergeStrokeDeltas";
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import type { IPixelDelta } from "@/features/editor/types/editor.type";
import type { TColorSlot } from "@/features/editor/logic/paletteMutations.type";
import { cellsInBounds, cellsOnLine } from "@/features/editor/logic/strokeLine";
import type { IGridPoint } from "@/features/editor/logic/strokeLine.type";
import type { IUsePixelPaintingParams } from "./usePixelPainting.type";

/**
 * Main button / touch uses the active slot; right button paints the opposite slot (desktop).
 */
function paletteIndexForButtons(
  buttons: number,
  activeSlot: TColorSlot,
  primary: number,
  secondary: number,
) {
  if (buttons === 2) {
    return activeSlot === "primary" ? secondary : primary;
  }
  return activeSlot === "primary" ? primary : secondary;
}

/** Writes `pi` at `index` and records a delta; returns false when the pixel already matched. */
function paintCell(
  pixelData: Uint8Array,
  deltas: IPixelDelta[],
  layerId: string,
  index: number,
  pi: number,
): boolean {
  const prev = pixelData[index];
  if (prev === pi) {
    return false;
  }
  pixelData[index] = pi;
  deltas.push({
    layerId,
    index,
    previousPaletteIndex: prev,
    newPaletteIndex: pi,
  });
  return true;
}

function sameCompositeColor(
  artwork: IArtwork,
  activeLayerId: string,
  originalActivePixels: Uint8Array,
  pixelOffset: number,
  targetCompositePaletteIndex: number | null,
): boolean {
  for (let i = 0; i < artwork.layers.length; i++) {
    const layer = artwork.layers[i];
    if (!layer.visible) {
      continue;
    }
    const paletteIndex =
      layer.id === activeLayerId ? originalActivePixels[pixelOffset] : layer.pixelData[pixelOffset];
    const color = artwork.palette[paletteIndex] ?? "transparent";
    if (color !== "transparent") {
      return paletteIndex === targetCompositePaletteIndex;
    }
  }
  return targetCompositePaletteIndex === null;
}

export function usePixelPainting({
  artwork,
  activeLayerId,
  activeLayerVisible,
  activeLayerPixelData,
  viewport,
  canvasRef,
  activeSlot,
  primaryPaletteIndex,
  secondaryPaletteIndex,
  onCommitStroke,
  onPixelsChanged,
  deferPrimaryPaint,
  bucketMode = false,
  touchPointersRef,
  onHiddenActiveLayerPaintAttempt,
}: IUsePixelPaintingParams) {
  const artworkRef = useRef(artwork);
  const activeLayerIdRef = useRef(activeLayerId);
  const activeLayerVisibleRef = useRef(activeLayerVisible);
  const activeLayerPixelDataRef = useRef(activeLayerPixelData);
  const viewportRef = useRef(viewport);

  useEffect(() => {
    artworkRef.current = artwork;
    activeLayerIdRef.current = activeLayerId;
    activeLayerVisibleRef.current = activeLayerVisible;
    activeLayerPixelDataRef.current = activeLayerPixelData;
    viewportRef.current = viewport;
  }, [artwork, activeLayerId, activeLayerVisible, activeLayerPixelData, viewport]);

  const strokeRaw = useRef<IPixelDelta[]>([]);
  /** Last grid cell of the active stroke (may be off-canvas); null when idle. */
  const lastCell = useRef<IGridPoint | null>(null);
  /** True while a paint stroke is active for the captured pointer (draw permission). */
  const painting = useRef(false);
  const activePaintingPointerId = useRef<number | null>(null);
  const activeSlotRef = useRef(activeSlot);
  const bucketModeRef = useRef(bucketMode);

  useEffect(() => {
    activeSlotRef.current = activeSlot;
  }, [activeSlot]);

  useEffect(() => {
    bucketModeRef.current = bucketMode;
  }, [bucketMode]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!painting.current) {
        return;
      }
      if (e.pointerId !== activePaintingPointerId.current) {
        return;
      }
      const canvas = canvasRef.current;
      const art = artworkRef.current;
      const layerId = activeLayerIdRef.current;
      const pixelData = activeLayerPixelDataRef.current;
      if (!canvas) {
        return;
      }
      if (!layerId || !pixelData || !activeLayerVisibleRef.current) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const pi = paletteIndexForButtons(
        e.buttons,
        activeSlotRef.current,
        primaryPaletteIndex,
        secondaryPaletteIndex,
      );
      const samples = e.getCoalescedEvents?.();
      const events = samples && samples.length > 0 ? samples : [e];
      let changed = false;
      for (const sample of events) {
        const cell = screenToWorldCoordinates(
          sample.clientX - rect.left,
          sample.clientY - rect.top,
          viewportRef.current,
        );
        const from = lastCell.current ?? cell;
        const path = cellsInBounds(cellsOnLine(from, cell).slice(1), art.width, art.height);
        for (const p of path) {
          if (paintCell(pixelData, strokeRaw.current, layerId, p.x + p.y * art.width, pi)) {
            changed = true;
          }
        }
        lastCell.current = { x: cell.x, y: cell.y };
      }
      if (changed) {
        onPixelsChanged();
      }
    };

    const endStroke = () => {
      if (!painting.current) {
        return;
      }
      painting.current = false;
      activePaintingPointerId.current = null;
      lastCell.current = null;
      const merged = mergeStrokeDeltas(strokeRaw.current);
      strokeRaw.current = [];
      if (merged.length > 0) {
        onCommitStroke({ deltas: merged });
      }
    };

    /** Runs after useEditorPointerContacts capture handler so the Set already includes this pointer. */
    const onTouchPointerDownEndStrokeIfMulti = (e: PointerEvent) => {
      if (e.pointerType !== "touch") {
        return;
      }
      if (touchPointersRef.current.size > 1 && painting.current) {
        endStroke();
      }
    };

    const onPointerFinish = (e: PointerEvent) => {
      if (e.pointerId !== activePaintingPointerId.current) {
        return;
      }
      endStroke();
    };

    window.addEventListener("pointerdown", onTouchPointerDownEndStrokeIfMulti, true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onPointerFinish);
    window.addEventListener("pointercancel", onPointerFinish);
    return () => {
      window.removeEventListener("pointerdown", onTouchPointerDownEndStrokeIfMulti, true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onPointerFinish);
      window.removeEventListener("pointercancel", onPointerFinish);
    };
  }, [
    canvasRef,
    primaryPaletteIndex,
    secondaryPaletteIndex,
    onCommitStroke,
    onPixelsChanged,
    touchPointersRef,
  ]);

  const onArtworkPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.button !== 2) {
      return;
    }
    if (e.button === 0 && deferPrimaryPaint?.()) {
      return;
    }
    if (e.pointerType === "touch" && touchPointersRef.current.size > 1) {
      e.preventDefault();
      return;
    }

    if (
      activePaintingPointerId.current !== null &&
      activePaintingPointerId.current !== e.pointerId
    ) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const canvas = canvasRef.current;
    const art = artworkRef.current;
    const layerId = activeLayerIdRef.current;
    const pixelData = activeLayerPixelDataRef.current;
    if (!canvas) {
      return;
    }
    if (!layerId || !pixelData) {
      return;
    }
    if (!activeLayerVisibleRef.current) {
      onHiddenActiveLayerPaintAttempt?.();
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { x, y } = screenToWorldCoordinates(mx, my, viewportRef.current);
    const pi = paletteIndexForButtons(
      e.buttons,
      activeSlotRef.current,
      primaryPaletteIndex,
      secondaryPaletteIndex,
    );
    if (x >= 0 && y >= 0 && x < art.width && y < art.height) {
      const index = x + y * art.width;
      if (bucketModeRef.current) {
        const originalActivePixels = new Uint8Array(pixelData);
        let targetCompositePaletteIndex: number | null = null;
        for (let i = 0; i < art.layers.length; i++) {
          const layer = art.layers[i];
          if (!layer.visible) {
            continue;
          }
          const paletteIndex =
            layer.id === layerId ? originalActivePixels[index] : layer.pixelData[index];
          const color = art.palette[paletteIndex] ?? "transparent";
          if (color !== "transparent") {
            targetCompositePaletteIndex = paletteIndex;
            break;
          }
        }
        if (targetCompositePaletteIndex === pi) {
          return;
        }

        const queue = [index];
        const visited = new Uint8Array(art.width * art.height);
        const deltas: IPixelDelta[] = [];
        while (queue.length > 0) {
          const current = queue.pop();
          if (current === undefined) {
            continue;
          }
          if (visited[current] === 1) {
            continue;
          }
          visited[current] = 1;
          if (
            !sameCompositeColor(
              art,
              layerId,
              originalActivePixels,
              current,
              targetCompositePaletteIndex,
            )
          ) {
            continue;
          }
          const prev = pixelData[current];
          if (prev !== pi) {
            pixelData[current] = pi;
            deltas.push({
              layerId,
              index: current,
              previousPaletteIndex: prev,
              newPaletteIndex: pi,
            });
          }
          const cx = current % art.width;
          const cy = Math.floor(current / art.width);
          if (cx > 0) {
            queue.push(current - 1);
          }
          if (cx + 1 < art.width) {
            queue.push(current + 1);
          }
          if (cy > 0) {
            queue.push(current - art.width);
          }
          if (cy + 1 < art.height) {
            queue.push(current + art.width);
          }
        }
        if (deltas.length > 0) {
          onPixelsChanged();
          onCommitStroke({ deltas });
        }
        return;
      }
      activePaintingPointerId.current = e.pointerId;
      painting.current = true;
      strokeRaw.current = [];
      lastCell.current = { x, y };
      if (paintCell(pixelData, strokeRaw.current, layerId, index, pi)) {
        onPixelsChanged();
      }
    }
  };

  return { onArtworkPointerDown };
}
