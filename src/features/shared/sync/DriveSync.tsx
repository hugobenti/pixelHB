/**
 * Purpose:
 * Render-nothing component that keeps the sync engine in step with the signed-in account; mounted
 * once inside the session provider.
 */
"use client";

import { useDriveSync } from "./useDriveSync";

export function DriveSync() {
  useDriveSync();
  return null;
}
