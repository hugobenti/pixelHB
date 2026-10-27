/**
 * Purpose:
 * AccountControl behavior: the account state, the avatar monogram, the disclosure popover (closes
 * on Escape, on a press outside and on navigation) and the sign-in / sign-out requests.
 *
 * Notes:
 * Escape closes the panel and returns focus to the avatar, whether focus is on the avatar or inside
 * the panel. `requestSignOut` is a plain Auth.js sign-out.
 */
"use client";

import { signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { useAccount } from "@/features/shared/auth/useAccount";

export function useAccountControl() {
  const account = useAccount();
  const pathname = usePathname();
  const triggerId = useId();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  /** The pathname the panel was opened on: navigating elsewhere closes it without an effect. */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  if (openedOn !== null && openedOn !== pathname) {
    setOpenedOn(null);
  }
  const open = openedOn === pathname;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpenedOn(null);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  const label = account.user?.name || account.user?.email || "";

  return {
    account,
    /** First character (code point) of the name, falling back to the email. */
    initial: (Array.from(label)[0] ?? "").toUpperCase(),
    open,
    toggle: () => setOpenedOn(open ? null : pathname),
    close: () => setOpenedOn(null),
    rootRef,
    triggerId,
    panelId,
    onPanelKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Escape" || !open) return;
      event.preventDefault();
      setOpenedOn(null);
      document.getElementById(triggerId)?.focus();
    },
    requestSignIn: () => void signIn("google"),
    requestSignOut: () => void signOut(),
  };
}
