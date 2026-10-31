/**
 * Purpose:
 * Viewport wrapper with stacked artwork + reference + grid canvases.
 */
"use client";
import { editor } from "@/content/editor";
import { PixelGridOverlay } from "@/features/editor/components/PixelGridOverlay";
import { ReferenceImageOverlay } from "@/features/editor/components/ReferenceImageOverlay";
import { canvasContainer } from "./CanvasContainer.style";
import type { ICanvasContainerProps } from "./CanvasContainer.type";
import { useCanvasContainer } from "./useCanvasContainer";

export function CanvasContainer({
  wrapRef,
  artworkCanvasRef,
  referenceImageCanvasRef,
  gridCanvasRef,
  viewportHandlers,
  onArtworkPointerDown,
}: ICanvasContainerProps) {
  const { preventContextMenu } = useCanvasContainer();

  return (
    <div className={canvasContainer.shell}>
      <div
        ref={wrapRef}
        className={canvasContainer.stack}
        {...viewportHandlers}
        role="application"
        aria-label={editor.viewport.label}
        tabIndex={0}
      >
        <canvas
          ref={artworkCanvasRef}
          className={canvasContainer.artworkCanvas}
          onPointerDown={onArtworkPointerDown}
          onContextMenu={preventContextMenu}
        />
        <ReferenceImageOverlay canvasRef={referenceImageCanvasRef} />
        <PixelGridOverlay canvasRef={gridCanvasRef} />
      </div>
    </div>
  );
}
