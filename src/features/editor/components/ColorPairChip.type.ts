import type { TColorSlot } from "@/features/editor/logic/paletteMutations.type";

export interface IColorPairChipProps {
  primaryColor: string;
  secondaryColor: string;
  /** The slot the left button paints; its square sits in front. */
  activeSlot: TColorSlot;
  onToggle: () => void;
}
