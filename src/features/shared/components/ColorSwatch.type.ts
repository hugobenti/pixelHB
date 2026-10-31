import type { colorSwatch } from "./ColorSwatch.style";

export type TColorSwatchDensity = keyof typeof colorSwatch.density;

export type TColorSwatchRing = keyof typeof colorSwatch.ring;

export interface IColorSwatchRowProps {
  density: "comfortable";
  color: string;
  index: number;
  isPrimary: boolean;
  isSecondary: boolean;
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

export interface IColorSwatchView {
  title: string;
  ariaLabel: string;
  ariaPressed: boolean | undefined;
  ariaCurrent: "true" | undefined;
  ring: TColorSwatchRing;
  focused: boolean;
  /** Corner markers that tell the slots apart without relying on hue. */
  showPrimaryMarker: boolean;
  showSecondaryMarker: boolean;
}
