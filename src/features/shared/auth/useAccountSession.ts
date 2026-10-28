/**
 * Purpose:
 * Owns the account state: fetches `/api/auth/session` itself, keeps it fresh (poll every 5 minutes
 * while not signed out, on tab focus, when the browser comes back online, and when another tab
 * signs out) and retries failed requests with backoff.
 *
 * Notes:
 * A failed request never changes the state (see `nextAccountState`): offline, a 5xx or a non-JSON
 * answer keeps the last known account, or `loading` before the first answer. Retries are scheduled
 * with backoff while the browser reports online; while offline the `online` event is the retry.
 * The poll also lets `/api/auth/session` rewrite the rotated token cookie. Other tabs are told by
 * Auth.js's own `next-auth` BroadcastChannel (its `signOut` posts there).
 */
"use client";

import { useEffect, useState } from "react";

import type { IAccountState } from "./auth.type";
import {
  LOADING_ACCOUNT,
  fetchAccountSession,
  nextAccountState,
  retryDelayMs,
} from "./logic/accountSession";

const POLL_MS = 300_000;
const AUTH_CHANNEL = "next-auth";

export function useAccountSession(): IAccountState {
  const [account, setAccount] = useState<IAccountState>(LOADING_ACCOUNT);

  useEffect(() => {
    let current: IAccountState = LOADING_ACCOUNT;
    let disposed = false;
    let inFlight = false;
    let again = false;
    let failures = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const refresh = async (): Promise<void> => {
      if (inFlight) {
        again = true;
        return;
      }
      inFlight = true;
      clearTimeout(retryTimer);
      const result = await fetchAccountSession(fetch);
      inFlight = false;
      if (disposed) return;
      const next = nextAccountState(current, result);
      if (next !== current) {
        current = next;
        setAccount(next);
      }
      if (result.kind === "failed") {
        failures += 1;
        if (navigator.onLine) retryTimer = setTimeout(() => void refresh(), retryDelayMs(failures));
      } else {
        failures = 0;
      }
      if (again) {
        again = false;
        void refresh();
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onOnline = () => {
      failures = 0;
      void refresh();
    };
    const poll = setInterval(() => {
      if (navigator.onLine && current.status !== "signedOut") void refresh();
    }, POLL_MS);
    const channel =
      typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(AUTH_CHANNEL);
    const onMessage = () => void refresh();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    channel?.addEventListener("message", onMessage);
    void refresh();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      channel?.removeEventListener("message", onMessage);
      channel?.close();
    };
  }, []);

  return account;
}
