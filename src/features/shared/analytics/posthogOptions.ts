/**
 * Purpose:
 * The options PostHog is initialised with: EU Cloud through the /ingest proxy, anonymous only, and
 * a session replay that never records artwork.
 *
 * Notes:
 * Artwork must not leave the device. Replay blocks every <canvas> and every data:/blob: image (the
 * gallery thumbnails and the reference image) and never records canvas frames, whatever the project
 * settings say. The editor puts the artwork name in the document title, so the <title> text is
 * masked in replays and the `title` property is dropped from events. Autocapture is off (it would
 * send clicked element text such as artwork names); heatmaps collect click positions only.
 */
import type { BeforeSendFn, PostHogConfig } from "posthog-js";

/** Event properties that can carry the document title (the open artwork's name). */
const TITLE_PROPERTIES = ["title", "$title"];

export const stripTitle: BeforeSendFn = (event) => {
  for (const key of TITLE_PROPERTIES) delete event.properties[key];
  return event;
};

export const POSTHOG_OPTIONS: Partial<PostHogConfig> = {
  api_host: "/ingest",
  ui_host: "https://eu.posthog.com",
  person_profiles: "identified_only",
  capture_pageview: "history_change",
  persistence: "localStorage",
  autocapture: false,
  enable_heatmaps: true,
  disable_surveys: true,
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: "title",
    blockSelector: "canvas, img[src^='data:'], img[src^='blob:']",
    captureCanvas: { recordCanvas: false },
    recordHeaders: false,
    recordBody: false,
  },
  before_send: stripTitle,
};
