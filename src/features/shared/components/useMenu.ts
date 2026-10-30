"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { menuFocusIndex } from "@/features/shared/logic/menuNavigation";
import { menuPlacement } from "@/features/shared/logic/menuPlacement";
import type { TMenuPlacement } from "@/features/shared/logic/menuPlacement.type";
import { useMediaQuery } from "@/features/shared/hooks/useMediaQuery";
import { MENU_SHEET_QUERY } from "./Menu.data";
import { cx } from "@/features/shared/utils/cx";
import { menu as menuStyle } from "./Menu.style";
import type { IMenuItem, IMenuProps } from "./Menu.type";

const PLACEMENT_GAP = 4;

export function useMenu({ items, onOpenChange }: IMenuProps) {
  const [open, setOpen] = useState(false);
  const onOpenChangeRef = useRef(onOpenChange);
  const lastOpen = useRef(false);
  const [placement, setPlacement] = useState<TMenuPlacement | null>(null);
  const sheet = useMediaQuery(MENU_SHEET_QUERY);
  const triggerId = useId();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusIndexAfterOpen = useRef<number | null>(null);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  useEffect(() => {
    if (lastOpen.current === open) return;
    lastOpen.current = open;
    onOpenChangeRef.current?.(open);
  }, [open]);

  // Unmounting while open (e.g. Rename replaces the menu) must still report the close.
  useEffect(
    () => () => {
      if (lastOpen.current) {
        lastOpen.current = false;
        onOpenChangeRef.current?.(false);
      }
    },
    [],
  );

  const openAt = useCallback(
    (key: "ArrowDown" | "ArrowUp") => {
      focusIndexAfterOpen.current = menuFocusIndex(-1, key, items);
      setOpen(true);
    },
    [items],
  );

  useLayoutEffect(() => {
    if (!open || sheet) return;
    const trigger = rootRef.current?.getBoundingClientRect();
    const menuBox = menuRef.current?.getBoundingClientRect();
    if (!trigger || !menuBox) return;
    setPlacement(
      menuPlacement({
        triggerTop: trigger.top,
        triggerBottom: trigger.bottom,
        menuHeight: menuBox.height,
        viewportHeight: window.innerHeight,
        gap: PLACEMENT_GAP,
      }),
    );
    return () => setPlacement(null);
  }, [open, sheet]);

  // Focus only once placed: the unmeasured dropdown is `visibility: hidden` and cannot take focus.
  useEffect(() => {
    if (!open || sheet || placement === null) return;
    const focusIndex = focusIndexAfterOpen.current;
    if (focusIndex === null) return;
    menuRef.current?.querySelector<HTMLButtonElement>(`[data-menu-index="${focusIndex}"]`)?.focus();
    focusIndexAfterOpen.current = null;
  }, [open, sheet, placement]);

  useEffect(() => {
    if (!open || sheet) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open, sheet]);

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    openAt("ArrowDown");
  }, [open, openAt]);

  const onTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openAt(event.key);
      }
    },
    [openAt],
  );

  const onMenuKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        rootRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
        return;
      }
      if (event.key === "Tab") {
        setOpen(false);
        return;
      }
      const target = event.target;
      const item =
        target instanceof Element ? target.closest<HTMLElement>("[data-menu-index]") : null;
      const currentIndex = item ? Number(item.dataset.menuIndex) : -1;
      if (
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp" &&
        event.key !== "Home" &&
        event.key !== "End"
      ) {
        return;
      }
      const nextIndex = menuFocusIndex(currentIndex, event.key, items);
      if (nextIndex >= 0) {
        event.preventDefault();
        menuRef.current
          ?.querySelector<HTMLButtonElement>(`[data-menu-index="${nextIndex}"]`)
          ?.focus();
      }
    },
    [items],
  );

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || item.disabled) return;
      item.onSelect();
      setOpen(false);
      if (!sheet) rootRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    },
    [items, sheet],
  );

  return {
    open,
    sheet,
    triggerPopup: sheet ? ("dialog" as const) : ("menu" as const),
    triggerControls: !sheet && open ? menuId : undefined,
    dropdownClass: cx(
      menuStyle.items,
      menuStyle.placement[placement ?? "below"],
      placement === null && menuStyle.unmeasured,
    ),
    toneClass: (item: IMenuItem) => menuStyle.tone[item.tone ?? "default"],
    close,
    triggerId,
    menuId,
    rootRef,
    menuRef,
    toggle,
    onTriggerKeyDown,
    onMenuKeyDown,
    selectItem,
  };
}
