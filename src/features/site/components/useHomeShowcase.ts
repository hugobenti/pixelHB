/**
 * Purpose:
 * HomeShowcase behavior: plays the live drawings on the canvas, one after another, and exposes what
 * the miniature editor around it shows (pressed tool, palette slot, status line).
 *
 * Notes:
 * Pixels are written straight to the canvas every frame; React state changes only when
 * an action starts. Playback stops while paused, offscreen or in a hidden tab. Under
 * prefers-reduced-motion the finished drawing shows still, with no loop and no pause button.
 */
"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { home } from "@/content/home";
import { DEFAULT_PALETTE } from "@/features/shared/artwork/defaultPalette";
import {
  LIVE_EMPTY,
  LIVE_TIMING,
  pixelsToRgba,
  prepareDrawing,
} from "@/features/site/logic/liveCanvas";
import type { ILivePreparedDrawing, TLiveAction } from "@/features/site/logic/liveCanvas.type";
import { SHOWCASE_SECONDARY, SHOWCASE_SWATCH_STYLES, SHOWCASE_TOOLS } from "./HomeShowcase.data";
import type { IShowcaseView } from "./HomeShowcase.type";
import { LIVE_DRAWINGS } from "./liveDrawings.data";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const FRAME_MS = 1000 / 60;
const FIRST = LIVE_DRAWINGS[0];
const IDLE_VIEW: IShowcaseView = {
  drawingId: FIRST.id,
  tool: null,
  color: 0,
  status: "",
  faded: false,
};

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function useHomeShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState<IShowcaseView>(IDLE_VIEW);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const drawings = LIVE_DRAWINGS.map(prepareDrawing);
    const { showcase } = home;

    const paint = (pixels: Uint8Array, size: number, override: Map<number, number> | null) =>
      context.putImageData(
        new ImageData(pixelsToRgba(pixels, DEFAULT_PALETTE, override), size),
        0,
        0,
      );

    if (reducedMotion) {
      const still = drawings[0];
      paint(still.pixels, still.size, null);
      return;
    }

    let drawingIndex = 0;
    let drawing: ILivePreparedDrawing = drawings[drawingIndex];
    let pixels = new Uint8Array(drawing.pixels.length).fill(LIVE_EMPTY);
    let actionIndex = 0;
    let frame = 0;
    let painted = 0;
    let visible = true;
    let carry = 0;
    let last = 0;
    let rafId = 0;

    const begin = (action: TLiveAction) => {
      frame = 0;
      painted = 0;
      if (action.kind === "step") {
        const { step } = action;
        const part = step.kind === "touch" ? showcase.touch[drawing.id] : showcase.parts[step.kind];
        setView((v) => ({
          ...v,
          tool: step.tool,
          color: step.color,
          status: showcase.status(showcase.tools[step.tool], part),
        }));
      } else if (action.kind === "rest" || action.kind === "alive") {
        setView((v) => ({ ...v, tool: null, status: "" }));
      } else if (action.kind === "export") {
        setView((v) => ({ ...v, status: showcase.exporting }));
      } else if (action.kind === "fade") {
        setView((v) => ({ ...v, status: "", faded: true }));
      }
    };

    const startDrawing = () => {
      drawing = drawings[drawingIndex];
      pixels = new Uint8Array(drawing.pixels.length).fill(LIVE_EMPTY);
      actionIndex = 0;
      paint(pixels, drawing.size, null);
      setView({ ...IDLE_VIEW, drawingId: drawing.id });
      begin(drawing.actions[0]);
    };

    /** Advance one 60 fps frame; true when the current action is over. */
    const tick = (): boolean => {
      const action = drawing.actions[actionIndex];
      frame += 1;
      if (action.kind === "step") {
        const { step } = action;
        if (step.tool === "bucket") {
          if (frame === LIVE_TIMING.bucketClick) {
            for (const p of step.pixels) pixels[p] = step.color;
            paint(pixels, drawing.size, null);
          }
        } else {
          const target = Math.min(
            step.pixels.length,
            Math.ceil((frame / action.frames) * step.pixels.length),
          );
          for (; painted < target; painted += 1) pixels[step.pixels[painted]] = step.color;
          paint(pixels, drawing.size, null);
        }
        return frame >= action.frames;
      }
      if (action.kind === "alive") {
        const showing = frame < action.frame.frames && action.frame.pixels.length > 0;
        paint(pixels, drawing.size, showing ? new Map(action.frame.pixels) : null);
        return frame >= action.frame.frames;
      }
      return frame >= action.frames;
    };

    const loop = (time: number) => {
      rafId = requestAnimationFrame(loop);
      const elapsed = last ? Math.min(100, time - last) : FRAME_MS;
      last = time;
      if (pausedRef.current || !visible || document.hidden) return;
      carry += elapsed / FRAME_MS;
      while (carry >= 1) {
        carry -= 1;
        if (!tick()) continue;
        actionIndex += 1;
        if (actionIndex < drawing.actions.length) {
          begin(drawing.actions[actionIndex]);
        } else {
          drawingIndex = (drawingIndex + 1) % drawings.length;
          startDrawing();
        }
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(canvas);
    rafId = requestAnimationFrame((time) => {
      last = time;
      startDrawing();
      rafId = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [reducedMotion]);

  const { showcase } = home;
  return {
    canvasRef,
    label: showcase.label,
    title: showcase.drawings[view.drawingId],
    tools: SHOWCASE_TOOLS.map((item) => ({
      icon: item.icon,
      pressed: item.tool !== null && item.tool === view.tool,
    })),
    swatches: SHOWCASE_SWATCH_STYLES.map((swatch, index) => ({
      ...swatch,
      ring:
        index === view.color
          ? ("primary" as const)
          : index === SHOWCASE_SECONDARY
            ? ("secondary" as const)
            : ("idle" as const),
    })),
    pair: {
      primary: { backgroundColor: DEFAULT_PALETTE[view.color] },
      secondary: { backgroundColor: DEFAULT_PALETTE[SHOWCASE_SECONDARY] },
    },
    status: view.status,
    hex: view.tool ? DEFAULT_PALETTE[view.color] : "",
    faded: view.faded,
    canvasSize: FIRST.rows.length,
    showPause: !reducedMotion,
    pauseText: paused ? showcase.play : showcase.pause,
    pauseLabel: paused ? showcase.playLabel : showcase.pauseLabel,
    togglePause: () => {
      pausedRef.current = !pausedRef.current;
      setPaused(pausedRef.current);
    },
    caption: showcase.caption,
  };
}
