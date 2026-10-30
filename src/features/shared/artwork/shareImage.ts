/**
 * Purpose:
 * Share a pre-rendered PNG: share sheet (files only), else clipboard, else download.
 *
 * Notes:
 * Nothing is awaited before the first browser call, so the user activation of the click is intact
 * (Safari rejects a clipboard write that follows an `await`).
 */

import type { IShareablePng, IShareEnv, TShareMethod } from "./shareImage.type";

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/** A throwing `canShare` counts as "cannot share", so the clipboard is tried next. */
function canShareFiles(env: IShareEnv, data: ShareData): boolean {
  try {
    return env.canShare?.(data) === true;
  } catch {
    return false;
  }
}

export async function shareImage(
  png: IShareablePng,
  env: IShareEnv,
): Promise<TShareMethod | "cancelled"> {
  const data: ShareData = { files: [png.file] };
  if (env.share && canShareFiles(env, data)) {
    try {
      await env.share(data);
      return "native";
    } catch (error) {
      if (isAbort(error)) {
        return "cancelled";
      }
      env.download();
      return "download";
    }
  }
  if (env.writeImage) {
    try {
      await env.writeImage(png.blob);
      return "clipboard";
    } catch {
      env.download();
      return "download";
    }
  }
  env.download();
  return "download";
}
