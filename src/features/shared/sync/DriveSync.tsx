/**
 * Purpose:
 * Render-nothing component that keeps the sync engine in step with the signed-in account and
 * finishes an interrupted sign-out wipe; mounted
 * once inside the session provider.
 */
"use client";

import { useDriveSync } from "./useDriveSync";
import { usePendingWipe } from "./usePendingWipe";

export function DriveSync() {
  useDriveSync();
  usePendingWipe();
  return null;
}
