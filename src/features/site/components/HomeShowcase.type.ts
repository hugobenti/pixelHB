import type { CSSProperties } from "react";

import type { homeShowcase } from "./HomeShowcase.style";

export interface IShowcaseTool {
  icon: string;
  pressed: boolean;
}

export interface IShowcaseSwatch {
  key: string;
  style: CSSProperties;
  ring: keyof typeof homeShowcase.swatchRing;
}
