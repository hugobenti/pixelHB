/**
 * Purpose:
 * The keys of one shortcut in a `<kbd>`, written for the reader's platform.
 */
"use client";

import type { IKeyCombo } from "@/content/content.type";
import { shortcutKeys } from "./ShortcutKeys.style";
import { useShortcutKeys } from "./useShortcutKeys";

export function ShortcutKeys({ combo }: { combo: IKeyCombo }) {
  const keys = useShortcutKeys(combo);
  return <kbd className={shortcutKeys.keys}>{keys}</kbd>;
}
