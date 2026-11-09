/**
 * Purpose:
 * SiteHeader behavior: current-page marking, the phone menu (closes on navigation) and the theme
 * button.
 *
 * Notes:
 * The server snapshot of useResolvedTheme is always light, so a dark reload would show the moon
 * first. `themeReady` is false on the server and during hydration; the header keeps the button
 * invisible (layout kept) until it is true, so a wrong icon is never painted.
 */
"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { shell } from "@/content/shell";
import { PUBLIC_ICONS } from "@/features/shared/constants/publicIcons";
import { useResolvedTheme, useSetTheme } from "@/features/shared/theme/useThemePreference";
import { SITE_MENU_LINKS, SITE_NAV } from "./siteNav.data";

const subscribeNever = () => () => {};

export function useSiteHeader() {
  const pathname = usePathname();
  const theme = useResolvedTheme();
  const setTheme = useSetTheme();
  const themeReady = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  /** The pathname the menu was opened on: navigating elsewhere closes it without an effect. */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  if (openedOn !== null && openedOn !== pathname) {
    // Navigated away (Link, Back, Forward): drop the stale open state so Forward cannot reopen it.
    setOpenedOn(null);
  }

  const isDark = theme === "dark";

  return {
    navItems: SITE_NAV.map((item) => ({ ...item, current: pathname === item.href })),
    menuItems: SITE_MENU_LINKS.map((item) => ({ ...item, current: pathname === item.href })),
    menuOpen: openedOn === pathname,
    openMenu: () => setOpenedOn(pathname),
    closeMenu: () => setOpenedOn(null),
    themeReady,
    /** Home's hero carries the same "Start drawing" call; the header drops its copy there (one primary per view). */
    showPrimaryAction: pathname !== "/",
    themeButton: {
      icon: isDark ? PUBLIC_ICONS.sun : PUBLIC_ICONS.moon,
      label: isDark ? shell.theme.toLight : shell.theme.toDark,
      onClick: () => setTheme(isDark ? "light" : "dark"),
    },
  };
}
