/**
 * Purpose:
 * Classes for the GalleryScreen route: content column, heading row, storage note (with its tone and progress dot) and error line.
 */

export const galleryScreen = {
  content: "flex flex-col gap-6",
  header: "flex flex-col gap-2",
  headingRow: "flex flex-wrap items-center justify-between gap-3",
  titleGroup: "flex items-baseline gap-3",
  count: "font-mono text-sm text-muted",
  srOnly: "sr-only",
  importInput: "hidden",
  /** Only attention text sits in the live region; routine syncing and saved text is not announced. */
  note: "flex flex-wrap items-center text-sm",
  noteText: "mr-1.5 empty:mr-0",
  noteTone: {
    neutral: "text-muted",
    progress: "text-muted",
    attention: "font-medium text-fg",
  },
  progressDot: "mr-1.5 size-1.5 rounded-full bg-muted motion-safe:animate-pulse",
  error: "rounded-lg bg-danger-surface px-4 py-3 text-sm text-danger-fg",
};
