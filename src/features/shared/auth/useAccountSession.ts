/**
 * Purpose:
 * Owns the account state in the browser: wires `createAccountSessionController` to `fetch`,
 * timers, the account hint in localStorage and the page events that should trigger a check.
 *
 * Notes:
 * Checks run on mount, every 5 minutes while not definitively signed out (this also lets
 * `/api/auth/session` rewrite the rotated token cookie), when the tab becomes visible, when the
 * browser comes back online and when another tab signs in or out (Auth.js's own `next-auth`
 * BroadcastChannel). The decisions, retries and backoff live in the controller.
 */
"use client";

import { useEffect, useState } from "react";

import { clearAccountHint, readAccountHint, writeAccountHint } from "./accountHintStore";
import type { IAccountState } from "./auth.type";
import { LOADING_ACCOUNT } from "./logic/accountSession";
import { createAccountSessionController } from "./logic/accountSessionController";

const POLL_MS = 300_000;
const AUTH_CHANNEL = "next-auth";

export function useAccountSession(): IAccountState {
  const [account, setAccount] = useState<IAccountState>(LOADING_ACCOUNT);

  useEffect(() => {
    const controller = createAccountSessionController({
      fetchFn: (input, init) => fetch(input, init),
      readHint: readAccountHint,
      writeHint: writeAccountHint,
      clearHint: clearAccountHint,
      isOnline: () => navigator.onLine,
      setTimer: (callback, ms) => setTimeout(callback, ms),
      clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
      onState: setAccount,
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") void controller.refresh();
    };
    const onOnline = () => void controller.online();
    const onMessage = () => void controller.refresh();
    const poll = setInterval(() => void controller.poll(), POLL_MS);
    const channel =
      typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(AUTH_CHANNEL);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    channel?.addEventListener("message", onMessage);
    void controller.refresh();

    return () => {
      controller.dispose();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      channel?.removeEventListener("message", onMessage);
      channel?.close();
    };
  }, []);

  return account;
}
