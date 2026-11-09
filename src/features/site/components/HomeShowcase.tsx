/**
 * Purpose:
 * Home hero illustration: a miniature of the editor with an illustrative sprite on the canvas, and a
 * caption showing that sprite at its real exported size.
 *
 * Notes:
 * The miniature is one image to assistive tech (its parts are presentational); the caption is text.
 */

import Image from "next/image";

import { home } from "@/content/home";
import { PublicMaskIcon } from "@/features/shared/components/PublicMaskIcon";
import { PUBLIC_ICONS } from "@/features/shared/constants/publicIcons";
import { cx } from "@/features/shared/utils/cx";
import {
  SHOWCASE_COLOR_PAIR,
  SHOWCASE_SPRITE,
  SHOWCASE_SWATCHES,
  SHOWCASE_TOOLS,
} from "./HomeShowcase.data";
import { homeShowcase } from "./HomeShowcase.style";

export function HomeShowcase() {
  const { showcase } = home;

  return (
    <figure className={homeShowcase.figure}>
      <div role="img" aria-label={showcase.label} className={homeShowcase.frame}>
        <div className={homeShowcase.toolbar}>
          <PublicMaskIcon src={PUBLIC_ICONS.chevronLeft} className={homeShowcase.back} />
          <span className={homeShowcase.artworkTitle}>{showcase.artworkTitle}</span>
          <span className={homeShowcase.tools}>
            {SHOWCASE_TOOLS.map((tool) => (
              <span
                key={tool.icon}
                className={cx(homeShowcase.tool, tool.pressed && homeShowcase.toolPressed)}
              >
                <PublicMaskIcon src={tool.icon} className={homeShowcase.toolIcon} />
              </span>
            ))}
          </span>
          <span className={homeShowcase.pair}>
            <span className={homeShowcase.pairPrimary} style={SHOWCASE_COLOR_PAIR.primary} />
            <span className={homeShowcase.pairSecondary} style={SHOWCASE_COLOR_PAIR.secondary} />
          </span>
        </div>
        <div className={homeShowcase.palette}>
          {SHOWCASE_SWATCHES.map((swatch) => (
            <span
              key={swatch.key}
              className={cx(homeShowcase.swatch, homeShowcase.swatchRing[swatch.ring])}
              style={swatch.style}
            />
          ))}
        </div>
        <div className={homeShowcase.well}>
          <div className={homeShowcase.canvas}>
            <Image
              src={SHOWCASE_SPRITE.src}
              width={SHOWCASE_SPRITE.width}
              height={SHOWCASE_SPRITE.height}
              alt=""
              unoptimized
              priority
              className={homeShowcase.sprite}
            />
          </div>
        </div>
      </div>
      <figcaption className={homeShowcase.caption}>
        <Image
          src={SHOWCASE_SPRITE.src}
          width={SHOWCASE_SPRITE.width}
          height={SHOWCASE_SPRITE.height}
          alt={showcase.spriteAlt}
          unoptimized
          className={homeShowcase.spriteActual}
        />
        <span>
          {showcase.caption} <span className={homeShowcase.size}>{showcase.size}</span>
        </span>
      </figcaption>
    </figure>
  );
}
