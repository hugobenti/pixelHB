/**
 * Purpose:
 * Classes for the EditorWorkspace layout: full-height shell, toolbar header and the canvas area.
 *
 * Notes:
 * The shell gives up `--consent-banner-height` (set while the analytics banner is shown), so the
 * banner sits below the editor instead of over the canvas or its controls.
 */

export const editorWorkspace = {
  shell:
    "mx-auto flex h-[calc(min(100dvh,100vh)-var(--consent-banner-height,0px))] w-full max-w-6xl flex-col gap-2 px-4 py-4 min-h-0",
  chrome: "flex shrink-0 flex-col gap-0",
  main: "flex min-h-0 flex-1 flex-col",
};
