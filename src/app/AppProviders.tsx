/**
 * Purpose:
 * Client-side app shell providers: the Google session, the toast stack, keeping the light/dark theme
 * in step with the user's pick and the OS setting, and consent-gated analytics with its banner.
 *
 * Notes:
 * Hooks called in the body of AppProviders are outside AuthSessionProvider; mount session-aware
 * hooks in a child component rendered inside it.
 */
"use client";
import { AnalyticsConsentBanner } from "@/features/shared/analytics/AnalyticsConsentBanner";
import { useAnalyticsStart } from "@/features/shared/analytics/useAnalyticsConsent";
import { AuthSessionProvider } from "@/features/shared/auth/AuthSessionProvider";
import { ToastProvider } from "@/features/shared/components/Toast";
import { DriveSync } from "@/features/shared/sync/DriveSync";
import { useThemeSync } from "@/features/shared/theme/useThemePreference";
import type { IAppProvidersProps } from "./AppProviders.type";

export function AppProviders({ children }: IAppProvidersProps) {
  useThemeSync();
  useAnalyticsStart();
  return (
    <AuthSessionProvider>
      <ToastProvider>
        <DriveSync />
        {children}
        <AnalyticsConsentBanner />
      </ToastProvider>
    </AuthSessionProvider>
  );
}
