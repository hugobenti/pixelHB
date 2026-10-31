/**
 * Purpose:
 * Bind editor canvases to viewport size and schedule artwork/reference/grid renders.
 *
 * Notes (optional):
 * Grid and symmetry-guide colors are read from the design-token CSS variables on :root (src/app/globals.css);
 * the render effect (backdrop checkerboard and edge included) depends on the resolved theme so a light/dark switch repaints them.
 */
"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { EDITOR_ROOT_CSS_VARS } from "@/features/editor/constants/editorRootCssVars";
import { renderCanvas } from "@/features/shared/artwork/canvasRender";
import { drawCanvasBackdrop, drawCanvasEdge } from "@/features/editor/logic/canvasBackdrop";
import { renderPixelGrid } from "@/features/editor/logic/gridRender";
import { renderReferenceImage } from "@/features/editor/logic/referenceImageRender";
import { useResolvedTheme } from "@/features/shared/theme/useThemePreference";
import type { IUseCanvasEngineParams } from "./useCanvasEngine.type";

function readRootCssColor(cssVar: string): string {
  if (typeof document === "undefined") {
    return "";
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
}

export function useCanvasEngine({
  artwork,
  viewport,
  showPixelGrid,
  showReferenceImage,
  referenceImage,
  referenceImageAlpha,
  paintRevision,
  historyRevision,
}: IUseCanvasEngineParams) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const artworkCanvasRef = useRef<HTMLCanvasElement>(null);
  const referenceImageCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const [cssSize, setCssSize] = useState({ w: 320, h: 320 });
  const theme = useResolvedTheme();

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setCssSize({
        w: Math.max(1, Math.floor(r.width)),
        h: Math.max(1, Math.floor(r.height)),
      });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setCssSize({
      w: Math.max(1, Math.floor(r.width)),
      h: Math.max(1, Math.floor(r.height)),
    });
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const ac = artworkCanvasRef.current;
    const rc = referenceImageCanvasRef.current;
    const gc = gridCanvasRef.current;
    if (!artwork || !ac || !rc || !gc) {
      return;
    }

    ac.width = cssSize.w;
    ac.height = cssSize.h;
    rc.width = cssSize.w;
    rc.height = cssSize.h;
    gc.width = cssSize.w;
    gc.height = cssSize.h;

    const actx = ac.getContext("2d");
    const rctx = rc.getContext("2d");
    const gctx = gc.getContext("2d");
    if (!actx || !rctx || !gctx) {
      return;
    }

    actx.clearRect(0, 0, ac.width, ac.height);
    drawCanvasBackdrop(
      actx,
      artwork,
      viewport,
      {
        light: readRootCssColor(EDITOR_ROOT_CSS_VARS.checkerLight),
        dark: readRootCssColor(EDITOR_ROOT_CSS_VARS.checkerDark),
      },
      { w: cssSize.w, h: cssSize.h }
    );
    renderCanvas(actx, artwork, viewport, { clear: false });
    drawCanvasEdge(actx, artwork, viewport, readRootCssColor(EDITOR_ROOT_CSS_VARS.canvasEdge));
    if (showReferenceImage && referenceImage) {
      renderReferenceImage(
        rctx,
        referenceImage,
        artwork.width,
        artwork.height,
        viewport,
        referenceImageAlpha
      );
    } else {
      rctx.clearRect(0, 0, rc.width, rc.height);
    }

    if (showPixelGrid) {
      const gridColor = readRootCssColor(EDITOR_ROOT_CSS_VARS.gridLine);
      const centerH = readRootCssColor(EDITOR_ROOT_CSS_VARS.centerHorizontal);
      const centerV = readRootCssColor(EDITOR_ROOT_CSS_VARS.centerVertical);
      renderPixelGrid(
        gctx,
        artwork.width,
        artwork.height,
        viewport,
        {
          color: gridColor,
          centerHorizontalColor: centerH,
          centerVerticalColor: centerV,
          centerHaloColor: readRootCssColor(EDITOR_ROOT_CSS_VARS.guideHalo),
        },
        cssSize.w,
        cssSize.h
      );
    } else {
      gctx.clearRect(0, 0, gc.width, gc.height);
    }
  }, [
    artwork,
    viewport,
    showPixelGrid,
    showReferenceImage,
    referenceImage,
    referenceImageAlpha,
    cssSize.w,
    cssSize.h,
    paintRevision,
    historyRevision,
    theme,
  ]);

  return { wrapRef, artworkCanvasRef, referenceImageCanvasRef, gridCanvasRef, cssSize };
}
