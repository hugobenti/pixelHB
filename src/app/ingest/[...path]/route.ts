/**
 * Purpose:
 * `/ingest/*`: first-party proxy to PostHog EU Cloud for the consent-gated analytics.
 *
 * Notes:
 * A route handler rather than a `next.config` rewrite, so the Auth.js session cookie and any other
 * credential never reach PostHog (see `ingestProxy`). Each request is one function invocation.
 */
import { ingestResponseHeaders, ingestTarget } from "@/features/shared/analytics/ingestProxy";

export const maxDuration = 15;

async function proxy(request: Request): Promise<Response> {
  const { url, headers } = ingestTarget({ url: new URL(request.url), headers: request.headers });
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: ingestResponseHeaders(upstream.headers),
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

export { proxy as GET, proxy as POST };
