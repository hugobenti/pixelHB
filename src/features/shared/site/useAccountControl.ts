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
import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";

import { useAccount } from "@/features/shared/auth/useAccount";
import { syncStatusText } from "@/features/shared/sync/logic/syncStatusMessage";
import { useSyncMessage } from "@/features/shared/sync/useSyncMessage";

/** The client never learns the folder id, so this is a Drive search for the folder's name. */
const DRIVE_FOLDER_URL = "https://drive.google.com/drive/search?q=PixelHB";

export function useAccountControl() {
  const account = useAccount();
  const syncMessage = useSyncMessage();
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

  /** Hidden while the sign-in expired: the panel's reauth note already says so. */
  const message = account.status === "signedIn" && !account.needsReauth ? syncMessage : null;
  const label = account.user?.name || account.user?.email || "";

  return {
    account,
    /** Unscoped, same mapping as the gallery note; null unless signed in. */
    syncStatusText: message ? syncStatusText(message) : null,
    driveFolderUrl: DRIVE_FOLDER_URL,
    /** First character (code point) of the name, falling back to the email. */
    initial: (Array.from(label)[0] ?? "").toUpperCase(),
    open,
    toggle: () => setOpenedOn(open ? null : pathname),
    close: () => setOpenedOn(null),
    rootRef,
    triggerId,
    panelId,
    /** Focus left the control (Tab away): close. A null target (click on non-focusable content) is left to the pointer listener. */
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (
        event.relatedTarget instanceof Node &&
        !event.currentTarget.contains(event.relatedTarget)
      ) {
        setOpenedOn(null);
      }
    },
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
