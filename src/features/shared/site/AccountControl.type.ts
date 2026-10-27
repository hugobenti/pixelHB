import type { accountControl } from "./AccountControl.style";

export interface IAccountControlProps {
  /** `bar`: the header row (from `sm` up); `sheet`: inline in the phone menu. */
  placement: keyof typeof accountControl.placement;
}
