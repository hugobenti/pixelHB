/**
 * Purpose:
 * The Privacy page's analytics switch: on while consent is granted; turning it off withdraws consent
 * (PostHog opts out, resets and stops recording). Renders nothing without a PostHog key or before
 * hydration, when the stored choice is not known yet.
 */
"use client";

import { shared } from "@/content/shared";
import { Switch } from "@/features/shared/components/Switch";
import type { IAnalyticsPreferenceProps } from "./AnalyticsPreference.type";
import { useAnalyticsPreference } from "./useAnalyticsPreference";

export function AnalyticsPreference({ className }: IAnalyticsPreferenceProps) {
  const { visible, checked, onCheckedChange } = useAnalyticsPreference();

  if (!visible) {
    return null;
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      label={shared.analytics.switchLabel}
      hint={shared.analytics.switchHint}
      className={className}
    />
  );
}
