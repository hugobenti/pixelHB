/**
 * Purpose:
 * What a gallery card's Share menu item shows, from the state of loading and rendering the artwork.
 */
import type { ICardShareInputs, TCardShareState } from "./cardShareState.type";

export function cardShareState({ rendered, failed }: ICardShareInputs): TCardShareState {
  if (rendered) {
    return "ready";
  }
  return failed ? "failed" : "preparing";
}
