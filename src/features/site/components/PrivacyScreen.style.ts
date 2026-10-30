/**
 * Purpose:
 * Classes for PrivacyScreen (TermsScreen uses them too): the same reading layout as the About page,
 * plus the bordered analytics switch row.
 */

import { aboutScreen } from "./AboutScreen.style";

export const privacyScreen = {
  ...aboutScreen,
  updated: "text-sm text-muted",
  analyticsSwitch: "max-w-prose rounded-lg border border-line px-3",
};
