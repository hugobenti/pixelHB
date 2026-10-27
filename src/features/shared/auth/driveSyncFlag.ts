/**
 * Purpose:
 * The single switch for Google sign-in and Drive sync.
 *
 * Notes:
 * The literal `process.env.NEXT_PUBLIC_DRIVE_SYNC` access is required: Next inlines it into the
 * client bundle only in that exact form. Anything other than `on` means today's local-only app.
 */

export const DRIVE_SYNC_ENABLED: boolean = process.env.NEXT_PUBLIC_DRIVE_SYNC === "on";
