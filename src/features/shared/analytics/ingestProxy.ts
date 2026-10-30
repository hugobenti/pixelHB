/**
 * Purpose:
 * Maps a request under /ingest to PostHog EU Cloud: which host it goes to, and the headers that may
 * travel with it.
 *
 * Notes:
 * Next.js `rewrites` would forward every header, including the Auth.js session cookie (it holds the
 * Google tokens), so /ingest is a route handler that forwards an allowlist instead. The client IP
 * goes on as `x-forwarded-for` for PostHog's country lookup; the project discards it afterwards.
 * Paths mirror PostHog's documented Next.js rewrites: /static and /array to the assets host,
 * everything else to the API host.
 */
import type { IIngestTarget } from "./analytics.type";

export const INGEST_PREFIX = "/ingest";

const API_HOST = "https://eu.i.posthog.com";
const ASSETS_HOST = "https://eu-assets.i.posthog.com";

/** Request headers PostHog needs to read a payload; nothing that identifies a session. */
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "content-encoding",
  "content-type",
  "user-agent",
];

/** Response headers that must not come back: PostHog cookies, and encodings `fetch` already undid. */
const DROPPED_RESPONSE_HEADERS = [
  "set-cookie",
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
];

function clientIp(headers: Headers): string | null {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || null;
}

export function ingestTarget(request: { url: URL; headers: Headers }): IIngestTarget {
  const path = request.url.pathname.slice(INGEST_PREFIX.length) || "/";
  const assets = path.startsWith("/static/") || path.startsWith("/array/");
  const url = new URL(assets ? ASSETS_HOST : API_HOST);
  // Set as a pathname, never resolved as a URL: a path like "//other.host" stays on PostHog.
  url.pathname = path;
  url.search = request.url.search;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  const ip = clientIp(request.headers);
  if (ip) headers.set("x-forwarded-for", ip);
  return { url, headers };
}

export function ingestResponseHeaders(upstream: Headers): Headers {
  const headers = new Headers(upstream);
  for (const name of DROPPED_RESPONSE_HEADERS) headers.delete(name);
  return headers;
}
