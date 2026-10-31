import type { IAutofocusTargetLike, IModalAutofocusInput } from "./modalAutofocus.type";

/** Whether a modal may focus its `data-autofocus` target: a text field stays unfocused on touch so the keyboard does not cover the sheet. */
export function shouldAutofocusTarget({
  coarsePointer,
  isTextEntry,
}: IModalAutofocusInput): boolean {
  return !(coarsePointer && isTextEntry);
}

/** Input types that open the on-screen keyboard; an empty type is a text input. */
const TEXT_INPUT_TYPES = new Set([
  "",
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
]);

/** True when focusing the target raises the on-screen keyboard: a textarea, contenteditable, or a text-like input (not a checkbox, button…). */
export function isTextEntryField({
  tagName,
  inputType = "",
  isContentEditable = false,
}: IAutofocusTargetLike): boolean {
  if (isContentEditable) {
    return true;
  }
  const tag = tagName.toUpperCase();
  if (tag === "TEXTAREA") {
    return true;
  }
  return tag === "INPUT" && TEXT_INPUT_TYPES.has(inputType.toLowerCase());
}
