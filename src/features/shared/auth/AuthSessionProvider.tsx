/**
 * Purpose:
 * Mounts Auth.js's `SessionProvider` when Drive sync is on; with the flag off it renders only its
 * children, so no `/api/auth/session` request is ever made.
 *
 * Notes:
 * `refetchInterval={300}` also lets `/api/auth/session` rewrite the rotated token cookie within
 * five minutes. Hooks called in the body of the component that renders this provider are outside it.
 */
"use client";

import { SessionProvider } from "next-auth/react";

import type { IAuthSessionProviderProps } from "./auth.type";
import { DRIVE_SYNC_ENABLED } from "./driveSyncFlag";

export function AuthSessionProvider({ children }: IAuthSessionProviderProps) {
  return DRIVE_SYNC_ENABLED ? (
    <SessionProvider refetchInterval={300}>{children}</SessionProvider>
  ) : (
    <>{children}</>
  );
}
