import { expect, test } from "vitest";

import { POSTHOG_OPTIONS, stripTitle } from "./posthogOptions";

test("drops the document title, which holds the open artwork's name", () => {
  const event = {
    uuid: "u",
    event: "$pageview",
    properties: { title: "Sunset cat — PixelHB", $title: "Sunset cat", $current_url: "/editor/x" },
  };
  expect(stripTitle(event)?.properties).toEqual({ $current_url: "/editor/x" });
});

test("replay masks typing and never records the canvas or artwork images", () => {
  const replay = POSTHOG_OPTIONS.session_recording;
  expect(replay?.maskAllInputs).toBe(true);
  expect(replay?.captureCanvas?.recordCanvas).toBe(false);
  expect(replay?.blockSelector).toContain("canvas");
  expect(replay?.blockSelector).toContain("img[src^='data:']");
  expect(POSTHOG_OPTIONS.autocapture).toBe(false);
  expect(POSTHOG_OPTIONS.person_profiles).toBe("identified_only");
});
