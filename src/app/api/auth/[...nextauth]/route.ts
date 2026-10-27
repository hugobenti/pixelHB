/**
 * Purpose:
 * Auth.js route handlers; answer 404 unless Drive sync is on, so a flag-off deployment exposes no sign-in.
 */
import { handlers } from "@/auth";
import { DRIVE_SYNC_ENABLED } from "@/features/shared/auth/driveSyncFlag";

const notFound = async () => new Response(null, { status: 404 });

export const GET: typeof handlers.GET = DRIVE_SYNC_ENABLED ? handlers.GET : notFound;
export const POST: typeof handlers.POST = DRIVE_SYNC_ENABLED ? handlers.POST : notFound;
