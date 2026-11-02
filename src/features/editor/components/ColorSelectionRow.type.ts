import type { TColorSlot } from "@/features/editor/logic/paletteMutations.type";

export interface IColorSelectionRowProps {
  palette: string[];
  primaryIndex: number;
  secondaryIndex: number;
  activeSlot: TColorSlot;
  focusedSwatchIndex: number;
  onSwatchPick: (index: number) => void;
  onOpenPaletteModal: () => void;
}
