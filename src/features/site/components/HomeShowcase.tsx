/**
 * Purpose:
 * Home hero illustration: a miniature of the editor drawing illustrative pieces live, one after
 * another, with one caption row under it: the step being drawn, the "Illustrative samples" label
 * and the Pause button.
 *
 * Notes:
 * The miniature is one image to assistive tech (its parts are presentational); the status line is
 * decorative. The Pause button stops the motion (WCAG 2.2.2) and is absent under reduced motion,
 * where the canvas shows a finished drawing and never moves.
 */
"use client";

import { PublicMaskIcon } from "@/features/shared/components/PublicMaskIcon";
import { PUBLIC_ICONS } from "@/features/shared/constants/publicIcons";
import { cx } from "@/features/shared/utils/cx";
import { homeShowcase } from "./HomeShowcase.style";
import { useHomeShowcase } from "./useHomeShowcase";

export function HomeShowcase() {
  const {
    canvasRef,
    cursorRef,
    label,
    title,
    tools,
    swatches,
    pair,
    cursorVisible,
    status,
    hex,
    faded,
    canvasSize,
    showPause,
    pauseText,
    pauseLabel,
    togglePause,
    caption,
  } = useHomeShowcase();

  return (
    <figure className={homeShowcase.figure}>
      <div role="img" aria-label={label} className={homeShowcase.frame}>
        <div className={homeShowcase.toolbar}>
          <PublicMaskIcon src={PUBLIC_ICONS.chevronLeft} className={homeShowcase.back} />
          <span className={homeShowcase.artworkTitle}>{title}</span>
          <span className={homeShowcase.tools}>
            {tools.map((tool) => (
              <span
                key={tool.icon}
                className={cx(homeShowcase.tool, tool.pressed && homeShowcase.toolPressed)}
              >
                <PublicMaskIcon src={tool.icon} className={homeShowcase.toolIcon} />
              </span>
            ))}
          </span>
          <span className={homeShowcase.pair}>
            <span className={homeShowcase.pairPrimary} style={pair.primary} />
            <span className={homeShowcase.pairSecondary} style={pair.secondary} />
          </span>
        </div>
        <div className={homeShowcase.palette}>
          {swatches.map((swatch) => (
            <span
              key={swatch.key}
              className={cx(homeShowcase.swatch, homeShowcase.swatchRing[swatch.ring])}
              style={swatch.style}
            />
          ))}
        </div>
        <div className={homeShowcase.well}>
          <div className={homeShowcase.stage}>
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              className={cx(homeShowcase.canvas, faded && homeShowcase.canvasFaded)}
            />
            <span
              ref={cursorRef}
              className={cx(homeShowcase.cursor, !cursorVisible && homeShowcase.cursorHidden)}
            >
              <span className={homeShowcase.cursorPixel} />
            </span>
          </div>
        </div>
      </div>
      <figcaption className={homeShowcase.caption}>
        <span aria-hidden className={homeShowcase.status}>
          {status}
          <span className={homeShowcase.hex}>{hex}</span>
        </span>
        <span className={homeShowcase.label}>{caption}</span>
        {showPause ? (
          <button
            type="button"
            className={homeShowcase.pause}
            aria-label={pauseLabel}
            onClick={togglePause}
          >
            {pauseText}
          </button>
        ) : null}
      </figcaption>
    </figure>
  );
}
