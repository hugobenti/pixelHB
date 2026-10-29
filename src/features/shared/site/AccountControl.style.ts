/**
 * Purpose:
 * Classes for AccountControl: the placement wrappers, the avatar button, the Sign in with Google
 * button, the popover panel and the account details.
 *
 * Notes:
 * The Sign in with Google button follows Google's branding guidelines
 * (developers.google.com/identity/branding-guidelines, updated 2026-07-07) and Google's own HTML
 * button: Google Sans Medium 14/20 with 0.25px tracking, 40px tall, 4px radius, 12px side padding,
 * the 20px "G" 10px before the text, and a #303030 (light) / white (dark) state overlay at 8% on
 * hover and 12% when pressed or focused. Its fill, stroke, text and overlay colors are Google's
 * brand colors, the one required exception to the PixelHB palette, declared as the `google-btn-*`
 * tokens in globals.css. It keeps the site's focus ring and stays 40px on touch screens (Google's
 * fixed size).
 *
 * The "G" is Google's current gradient logo from the official signin-assets.zip, pixel for pixel:
 * public/brand/google-g-light.png and google-g-dark.png are the 80 × 80 logo area (the 20px logo
 * at 4x, x/y 40–120) of "Android + Web/PNG @4x/Light/Theme=Light, Show text=No, Shape=Square,
 * Platform=Android+Web@4x.png" and its Dark counterpart, cropped without resampling. Each sits on
 * its own theme's button fill, so the `--google-btn-logo` variable swaps them with the theme. The
 * logo stays under the state overlay, so hover tints it with the fill and never shows a square.
 */

import { focusRing } from "@/features/shared/components/focus.style";
import { cx } from "@/features/shared/utils/cx";

export const accountControl = {
  placement: {
    bar: "hidden sm:block relative",
    sheet: "mt-2 border-t border-line pt-4",
  },
  /** Holds the avatar's space while the session loads, so the header does not jump. */
  placeholder: "invisible size-10 pointer-coarse:size-11",
  avatar: cx(
    "inline-flex size-10 touch-manipulation items-center justify-center rounded-full border border-line-strong bg-surface-muted text-sm font-semibold text-fg transition-colors hover:bg-surface-strong pointer-coarse:size-11",
    focusRing,
  ),
  googleButton: cx(
    "group relative inline-flex h-10 max-w-100 min-w-min touch-manipulation items-center gap-2.5 overflow-hidden rounded-sm border border-google-btn-stroke bg-google-btn-fill px-3 font-google-btn text-sm font-medium tracking-[0.25px] whitespace-nowrap text-google-btn-text select-none hover:shadow-google-btn",
    focusRing,
  ),
  /** Width of the signed-out button: its content in the header row, the full menu width on phones. */
  signIn: {
    bar: "shrink-0",
    sheet: "w-full",
  },
  /** The reauth button fills the panel or the menu section. */
  reauth: "w-full",
  googleState:
    "absolute inset-0 bg-google-btn-state opacity-0 transition-opacity group-hover:opacity-8 group-focus-visible:opacity-12 group-active:opacity-12",
  googleLogo: "size-5 shrink-0 bg-(image:--google-btn-logo) bg-contain bg-no-repeat",
  googleLabel: "relative grow truncate text-center",
  panel:
    "absolute right-0 top-full z-50 mt-1 flex w-72 flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-lg",
  sheetSection: "flex flex-col gap-3",
  heading: "text-sm font-semibold text-muted",
  details: "flex flex-col gap-3",
  identity: "flex min-w-0 flex-col",
  userName: "truncate text-sm font-medium text-fg",
  userEmail: "truncate text-sm text-muted",
  note: "text-sm text-muted",
  driveLink: cx(
    "inline-flex min-h-10 items-center rounded-sm text-sm text-fg underline underline-offset-4 hover:text-fg-soft pointer-coarse:min-h-11",
    focusRing,
  ),
  srOnly: "sr-only",
  action: {
    bar: "w-full",
    sheet: "min-h-12 w-full",
  },
};
