/**
 * Purpose:
 * Display text of a key combination for the reader's platform: ⌘ on Apple devices, Ctrl elsewhere.
 *
 * Notes:
 * The server snapshot is "other", so the first render matches the server and an Apple client
 * switches to glyphs right after hydration.
 */
"use client";

import { useSyncExternalStore } from "react";

import { help } from "@/content/help";
import type { IKeyCombo } from "@/content/content.type";
import { formatKeyCombo } from "@/features/shared/logic/keyCombo";
import type { TKeyPlatform } from "@/features/shared/logic/keyCombo.type";

const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;

const subscribeNever = () => () => {};

function clientPlatform(): TKeyPlatform {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || nav.platform;
  return APPLE_PLATFORM.test(platform) ? "apple" : "other";
}

export function useShortcutKeys(combo: IKeyCombo): string {
  const platform = useSyncExternalStore<TKeyPlatform>(
    subscribeNever,
    clientPlatform,
    () => "other",
  );
  return formatKeyCombo(combo, platform, help.keyNames);
}
