/**
 * Purpose:
 * The PixelHB logo as an inline SVG named "PixelHB": the horizontal lockup (stamped pencil + pixel
 * wordmark) or the plain pencil.
 *
 * Notes:
 * Pencil colors are fixed; the wordmark and the drawn pixel use theme tokens, so the logo follows the
 * light and dark themes without re-rendering. A decorative logo is hidden from assistive tech.
 */

import { site } from "@/content/site";
import { cx } from "@/features/shared/utils/cx";
import { BRAND_LOGO_DRAWINGS } from "./BrandLogo.data";
import { brandLogo } from "./BrandLogo.style";
import type { IBrandLogoProps } from "./BrandLogo.type";

export function BrandLogo({
  variant = "horizontal",
  decorative = false,
  className,
}: IBrandLogoProps) {
  const drawing = BRAND_LOGO_DRAWINGS[variant];
  return (
    <svg
      viewBox={drawing.viewBox}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : site.name}
      aria-hidden={decorative ? true : undefined}
      shapeRendering="crispEdges"
      className={cx(brandLogo.svg, brandLogo.variant[variant], className)}
    >
      {drawing.rects.map((rect) => (
        <rect key={rect.id} x={rect.x} y={rect.y} width={rect.width} height={1} fill={rect.fill} />
      ))}
    </svg>
  );
}
