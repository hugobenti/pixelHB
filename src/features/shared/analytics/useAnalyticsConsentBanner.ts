/**
 * Purpose:
 * AnalyticsConsentBanner behavior: shown while analytics is configured and the visitor has not
 * chosen yet; Accept and Decline store the choice.
 *
 * Notes:
 * The banner is fixed to the bottom of the window but never covers anything: while it is shown its
 * height is published as `--consent-banner-height` on <html>, which the body pads by and the editor
 * shell subtracts from its height, so the canvas and every control stay visible and usable.
 */
"use client";

import { useEffect, useRef } from "react";

import { useAnalyticsConsent } from "./useAnalyticsConsent";

const BANNER_HEIGHT_VAR = "--consent-banner-height";

export function useAnalyticsConsentBanner() {
  const { enabled, consent, setConsent } = useAnalyticsConsent();
  const visible = enabled && consent === null;
  const bannerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const banner = bannerRef.current;
    if (!visible || !banner) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty(BANNER_HEIGHT_VAR, `${banner.offsetHeight}px`);
    });
    observer.observe(banner);
    return () => {
      observer.disconnect();
      root.style.removeProperty(BANNER_HEIGHT_VAR);
    };
  }, [visible]);

  return {
    visible,
    bannerRef,
    accept: () => setConsent("granted"),
    decline: () => setConsent("denied"),
  };
}
