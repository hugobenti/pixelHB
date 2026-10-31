import type { IModalAutofocusInput } from "./modalAutofocus.type";

/** Whether a modal may focus its `data-autofocus` target: a text field stays unfocused on touch so the keyboard does not cover the sheet. */
export function shouldAutofocusTarget({
  coarsePointer,
  isTextEntry,
}: IModalAutofocusInput): boolean {
  return !(coarsePointer && isTextEntry);
}
