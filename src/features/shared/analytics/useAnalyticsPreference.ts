/**
 * Purpose:
 * AnalyticsPreference behavior: the switch is on only while consent is granted, and flipping it
 * grants or withdraws consent.
 */
"use client";

import { useAnalyticsConsent } from "./useAnalyticsConsent";

export function useAnalyticsPreference() {
  const { enabled, consent, setConsent } = useAnalyticsConsent();
  return {
    visible: enabled && consent !== undefined,
    checked: consent === "granted",
    onCheckedChange: (checked: boolean) => setConsent(checked ? "granted" : "denied"),
  };
}
