import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists exactly the public pages as absolute URLs", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.map((url) => new URL(url).pathname)).toEqual([
      "/",
      "/gallery",
      "/help",
      "/about",
      "/contact",
      "/privacy",
    ]);
    for (const url of urls) {
      expect(url).toMatch(/^https:\/\/[^/]+(\/[^/]*)?$/);
      expect(url).not.toContain("/editor");
    }
  });
});

describe("robots", () => {
  it("blocks the editor and points at the sitemap", () => {
    const { rules, sitemap: sitemapUrl } = robots();
    const rule = Array.isArray(rules) ? rules[0] : rules;
    expect(rule.disallow).toBe("/editor/");
    expect(sitemapUrl).toMatch(/\/sitemap\.xml$/);
  });
});
