import { describe, expect, test } from "vitest";

import { ingestResponseHeaders, ingestTarget } from "./ingestProxy";

function request(path: string, headers: Record<string, string> = {}) {
  return { url: new URL(`https://pixelhb.example${path}`), headers: new Headers(headers) };
}

describe("ingestTarget URL", () => {
  test("sends static assets and remote config to the EU assets host", () => {
    const { url: staticUrl } = ingestTarget(request("/ingest/static/array.js?v=1"));
    expect(staticUrl.href).toBe("https://eu-assets.i.posthog.com/static/array.js?v=1");
    const { url: arrayUrl } = ingestTarget(request("/ingest/array/phc_x/config.js"));
    expect(arrayUrl.href).toBe("https://eu-assets.i.posthog.com/array/phc_x/config.js");
  });

  test("sends everything else to the EU API host, keeping the trailing slash and query", () => {
    const { url } = ingestTarget(request("/ingest/e/?ip=0&_=123&ver=1.0"));
    expect(url.href).toBe("https://eu.i.posthog.com/e/?ip=0&_=123&ver=1.0");
  });

  test("a path that looks like a host stays on PostHog", () => {
    expect(ingestTarget(request("/ingest//evil.example/x")).url.host).toBe("eu.i.posthog.com");
    expect(ingestTarget(request("/ingest/static//evil.example/x")).url.host).toBe(
      "eu-assets.i.posthog.com",
    );
  });
});

describe("ingestTarget headers", () => {
  const incoming = {
    cookie: "authjs.session-token=secret; ph_x=1",
    authorization: "Bearer secret",
    host: "pixelhb.example",
    "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    "x-real-ip": "203.0.113.7",
    "x-forwarded-host": "pixelhb.example",
    "content-type": "text/plain",
    "content-encoding": "gzip",
    "user-agent": "Mozilla/5.0",
    accept: "*/*",
  };

  test("drops the session cookie, credentials and the host", () => {
    const { headers } = ingestTarget(request("/ingest/e/", incoming));
    expect(headers.has("cookie")).toBe(false);
    expect(headers.has("authorization")).toBe(false);
    expect(headers.has("host")).toBe(false);
    expect(headers.has("x-forwarded-host")).toBe(false);
    expect(headers.has("x-real-ip")).toBe(false);
  });

  test("keeps what PostHog needs to read the payload", () => {
    const { headers } = ingestTarget(request("/ingest/e/", incoming));
    expect(headers.get("content-type")).toBe("text/plain");
    expect(headers.get("content-encoding")).toBe("gzip");
    expect(headers.get("user-agent")).toBe("Mozilla/5.0");
    expect(headers.get("accept")).toBe("*/*");
  });

  test("forwards only the client IP as x-forwarded-for", () => {
    expect(ingestTarget(request("/ingest/e/", incoming)).headers.get("x-forwarded-for")).toBe(
      "203.0.113.7",
    );
    const noRealIp = { "x-forwarded-for": "198.51.100.2, 10.0.0.1" };
    expect(ingestTarget(request("/ingest/e/", noRealIp)).headers.get("x-forwarded-for")).toBe(
      "198.51.100.2",
    );
    expect(ingestTarget(request("/ingest/e/")).headers.has("x-forwarded-for")).toBe(false);
  });
});

describe("ingestResponseHeaders", () => {
  test("drops cookies PostHog sets and the encoding headers fetch already undid", () => {
    const upstream = new Headers({
      "set-cookie": "a=b",
      "content-encoding": "gzip",
      "content-length": "10",
      "transfer-encoding": "chunked",
      "content-type": "application/javascript",
      "cache-control": "public, max-age=3600",
    });
    const headers = ingestResponseHeaders(upstream);
    expect(headers.has("set-cookie")).toBe(false);
    expect(headers.has("content-encoding")).toBe(false);
    expect(headers.has("content-length")).toBe(false);
    expect(headers.has("transfer-encoding")).toBe(false);
    expect(headers.get("content-type")).toBe("application/javascript");
    expect(headers.get("cache-control")).toBe("public, max-age=3600");
  });
});
