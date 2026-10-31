import type { colorSwatch } from "./ColorSwatch.style";

export type TColorSwatchDensity = keyof typeof colorSwatch.density;

export type TColorSwatchRing = keyof typeof colorSwatch.ring;

export interface IColorSwatchRowProps {
  density: "comfortable";
  color: string;
  index: number;
  isPrimary: boolean;
  isSecondary: boolean;
  /** The slot the left button paints; its swatch carries the top-left marker. */
  activeSlot: "primary" | "secondary";
  isFocused: boolean;
  onClick: () => void;
}

export interface IColorSwatchGridProps {
  density: "compact";
  color: string;
  index: number;
  selected: boolean;
  onClick: () => void;
}

export type TColorSwatchProps = IColorSwatchRowProps | IColorSwatchGridProps;

/** The fields of either swatch shape that decide its ring. */
export type TColorSwatchRingInput =
  | Pick<IColorSwatchGridProps, "density" | "selected">
  | Pick<IColorSwatchRowProps, "density" | "isPrimary" | "isSecondary">;

/** The fields of either swatch shape that decide its corner markers. */
export type TColorSwatchMarkerInput =
  | Pick<IColorSwatchGridProps, "density">
  | Pick<IColorSwatchRowProps, "density" | "isPrimary" | "isSecondary" | "activeSlot">;

export interface IColorSwatchView {
  title: string;
  ariaLabel: string;
  ariaPressed: boolean | undefined;
  ariaCurrent: "true" | undefined;
  ring: TColorSwatchRing;
  focused: boolean;
  /** Corner markers that tell the slots apart without relying on hue. */
  showTopLeftMarker: boolean;
  showBottomRightMarker: boolean;
}
