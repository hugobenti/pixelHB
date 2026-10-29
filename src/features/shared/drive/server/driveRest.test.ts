import { describe, expect, it, vi } from "vitest";
import { createDriveRest, DRIVE_REQUEST_TIMEOUT_MS, DriveError } from "./driveRest";
import type { IDriveRest } from "./driveRest.type";

interface IRecordedCall { method: string; url: URL; headers: Headers; body: Uint8Array | null }

function recorder(responses: Array<Response | Error>) {
  const calls: IRecordedCall[] = [];
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = init?.body == null ? null : new Uint8Array(await new Response(init.body).arrayBuffer());
    calls.push({ method: init?.method ?? "GET", url: new URL(String(input)), headers: new Headers(init?.headers), body });
    const next = responses.shift();
    if (!next) throw new Error("unexpected Drive call");
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
  return { fetchFn, calls };
}
const latin1 = (bytes: Uint8Array | null) => new TextDecoder("latin1").decode(bytes ?? new Uint8Array());
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("driveRest", () => {
  it("uploads ≤ 5 MiB as multipart/related with the metadata part first", async () => {
    const { fetchFn, calls } = recorder([Response.json({ id: "p-1", name: "a.png" })]);
    const file = await createDriveRest({ accessToken: "tok", fetchFn })
      .uploadNew({ name: "a.png", mimeType: "image/png", parents: ["root-1"] }, PNG, "image/png");
    expect(file).toEqual({ id: "p-1", name: "a.png" });
    const call = calls[0];
    expect(call.method).toBe("POST");
    expect(`${call.url.origin}${call.url.pathname}`).toBe("https://www.googleapis.com/upload/drive/v3/files");
    expect(call.url.searchParams.get("uploadType")).toBe("multipart");
    expect(call.url.searchParams.get("fields")).toBe("id,name,appProperties");
    expect(call.headers.get("Authorization")).toBe("Bearer tok");
    const contentType = call.headers.get("Content-Type") ?? "";
    expect(contentType).toMatch(/^multipart\/related; boundary=pixelhb-[0-9a-f-]{36}$/);
    const b = contentType.split("boundary=")[1];
    expect(latin1(call.body)).toBe(
      `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      `{"name":"a.png","mimeType":"image/png","parents":["root-1"]}\r\n` +
      `--${b}\r\nContent-Type: image/png\r\n\r\n${latin1(PNG)}\r\n--${b}--`,
    );
  });

  it("uses one resumable session above 5 MiB when updating", async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    const session = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc";
    const { fetchFn, calls } = recorder([
      new Response(null, { status: 200, headers: { Location: session } }),
      Response.json({ id: "f-1", name: "big.pixelhb.json" }),
    ]);
    await createDriveRest({ accessToken: "tok", fetchFn })
      .uploadExisting("f-1", { name: "big.pixelhb.json" }, big, "application/json");
    expect(calls[0].method).toBe("PATCH");
    expect(calls[0].url.pathname).toBe("/upload/drive/v3/files/f-1");
    expect(calls[0].url.searchParams.get("uploadType")).toBe("resumable");
    expect(calls[0].headers.get("X-Upload-Content-Type")).toBe("application/json");
    expect(calls[0].headers.get("X-Upload-Content-Length")).toBe(String(big.byteLength));
    expect(JSON.parse(latin1(calls[0].body))).toEqual({ name: "big.pixelhb.json" });
    expect(calls[1].method).toBe("PUT");
    expect(calls[1].url.href).toBe(session);
    expect(calls[1].body?.byteLength).toBe(big.byteLength);
  });

  it("listAll follows nextPageToken and sends the pinned fields mask", async () => {
    const { fetchFn, calls } = recorder([
      Response.json({ files: [{ id: "a", name: "a" }], nextPageToken: "p2" }),
      Response.json({ files: [{ id: "b", name: "b" }] }),
    ]);
    const files = await createDriveRest({ accessToken: "tok", fetchFn }).listAll({ q: "trashed=false" });
    expect(files.map((f) => f.id)).toEqual(["a", "b"]);
    expect(calls[0].url.searchParams.get("fields")).toBe("nextPageToken,files(id,name,appProperties,explicitlyTrashed)");
    expect(calls[0].url.searchParams.get("pageSize")).toBe("1000");
    expect(calls[0].url.searchParams.get("spaces")).toBe("drive");
    expect(calls[0].url.searchParams.has("pageToken")).toBe(false);
    expect(calls[1].url.searchParams.get("pageToken")).toBe("p2");
  });

  it("turns Drive error bodies into DriveError with reason and Retry-After", async () => {
    const { fetchFn } = recorder([
      Response.json(
        { error: { code: 429, message: "Rate Limit Exceeded", errors: [{ domain: "usageLimits", reason: "rateLimitExceeded", message: "Rate Limit Exceeded" }] } },
        { status: 429, headers: { "Retry-After": "7" } },
      ),
      new Response("<html>bad gateway</html>", { status: 502 }),
    ]);
    const rest = createDriveRest({ accessToken: "tok", fetchFn });
    const error = await rest.listAll({ q: "trashed=false" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DriveError);
    expect(error).toMatchObject({ status: 429, reason: "rateLimitExceeded", retryAfter: "7" });
    await expect(rest.listAll({ q: "trashed=false" })).rejects.toMatchObject({ status: 502, reason: null, retryAfter: null });
  });

  it("turns a rejected fetch into DriveError status 0 reason 'network'", async () => {
    const { fetchFn } = recorder([new TypeError("fetch failed")]);
    await expect(createDriveRest({ accessToken: "tok", fetchFn }).download("f-1"))
      .rejects.toMatchObject({ status: 0, reason: "network" });
  });

  it("gives up on a Drive call that hangs past the timeout with DriveError status 0 reason 'timeout'", async () => {
    const hanging = (async (_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      })) as typeof fetch;
    const rest = createDriveRest({ accessToken: "tok", fetchFn: hanging, timeoutMs: 20 });
    const error = await rest.listAll({ q: "trashed=false" }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(DriveError);
    expect(error).toMatchObject({ status: 0, reason: "timeout", retryAfter: null });
  });

  /** Answers headers at once, then a body that never ends until the request's signal aborts (as real fetch does). */
  const stalledBody = (status: number, seen: Array<AbortSignal | undefined> = []) =>
    (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal ?? undefined;
      seen.push(signal);
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          signal?.addEventListener("abort", () => controller.error(signal.reason));
        },
      });
      return new Response(body, { status, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch;

  // `AbortSignal.timeout` runs on the platform clock (fake timers don't reach it): 20 ms real waits.
  it.each([
    ["a list page", (rest: IDriveRest) => rest.listAll({ q: "trashed=false" }), 200],
    ["a created file", (rest: IDriveRest) => rest.createFolder({ name: "PixelHB" }), 200],
    ["an error body", (rest: IDriveRest) => rest.listAll({ q: "trashed=false" }), 400],
  ])("maps a timeout while reading %s to the retryable timeout DriveError", async (_label, run, status) => {
    const rest = createDriveRest({ accessToken: "tok", fetchFn: stalledBody(status), timeoutMs: 20 });
    const error = await run(rest).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(DriveError);
    expect(error).toMatchObject({ status: 0, reason: "timeout", retryAfter: null });
  });

  it("does not cut a download's body once Drive's headers arrived", async () => {
    const seen: Array<AbortSignal | undefined> = [];
    const rest = createDriveRest({ accessToken: "tok", fetchFn: stalledBody(200, seen), timeoutMs: 20 });
    const stream = await rest.download("f-1");
    // Real wait past the deadline: a platform `AbortSignal.timeout` would fire here, fake timers would not.
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 60);
    await promise;
    expect(stream).not.toBeNull();
    expect(seen[0]?.aborted).toBe(false);
    await stream?.cancel();
  });

  it("still times out a download whose headers never arrive", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const hanging = (async (_input: RequestInfo | URL, init?: RequestInit) => {
        const { promise, reject } = Promise.withResolvers<Response>();
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        return promise;
      }) as typeof fetch;
      const rest = createDriveRest({ accessToken: "tok", fetchFn: hanging, timeoutMs: 20 });
      const pending = rest.download("f-1");
      vi.advanceTimersByTime(20);
      await expect(pending).rejects.toMatchObject({ status: 0, reason: "timeout" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("bounds every Drive request, the resumable PUT included, with a 25 s abort signal by default", async () => {
    expect(DRIVE_REQUEST_TIMEOUT_MS).toBe(25_000);
    const signals: Array<AbortSignal | null | undefined> = [];
    const session = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc";
    const responses = [
      new Response(null, { status: 200, headers: { Location: session } }),
      Response.json({ id: "f-1", name: "big.json" }),
      Response.json({ files: [] }),
      new Response("{}"),
    ];
    const fetchFn = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      signals.push(init?.signal);
      return responses.shift()!;
    }) as typeof fetch;
    const rest = createDriveRest({ accessToken: "tok", fetchFn });
    await rest.uploadNew({ name: "big.json" }, new Uint8Array(5 * 1024 * 1024 + 1), "application/json");
    await rest.listAll({ q: "trashed=false" });
    await rest.download("f-1");
    expect(signals).toHaveLength(4);
    for (const signal of signals) {
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal?.aborted).toBe(false);
    }
  });

  it("download returns null on 404; trash sends {trashed:true} and ignores 404", async () => {
    const notFound = () => Response.json({ error: { code: 404, errors: [{ reason: "notFound" }] } }, { status: 404 });
    const { fetchFn, calls } = recorder([notFound(), notFound()]);
    const rest = createDriveRest({ accessToken: "tok", fetchFn });
    expect(await rest.download("gone")).toBeNull();
    expect(calls[0].url.href).toBe("https://www.googleapis.com/drive/v3/files/gone?alt=media");
    await expect(rest.trash("gone")).resolves.toBeUndefined();
    expect(calls[1].method).toBe("PATCH");
    expect(calls[1].url.href).toBe("https://www.googleapis.com/drive/v3/files/gone?fields=id");
    expect(JSON.parse(latin1(calls[1].body))).toEqual({ trashed: true });
  });

  it("sends the resumable PUT without Authorization", async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    const session = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc";
    const { fetchFn, calls } = recorder([
      new Response(null, { status: 200, headers: { Location: session } }),
      Response.json({ id: "f-1", name: "big.json" }),
    ]);
    await createDriveRest({ accessToken: "tok", fetchFn }).uploadNew({ name: "big.json" }, big, "application/json");
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
    expect(calls[1].method).toBe("PUT");
    expect(calls[1].headers.has("Authorization")).toBe(false);
  });

  it.each([
    ["a foreign origin", "https://evil.example/upload?id=1"],
    ["an unparsable URL", "not a url"],
    ["a missing header", null],
  ])("rejects a resumable session with %s as a 502 and never sends the bytes", async (_label, location) => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    const headers: Record<string, string> = location === null ? {} : { Location: location };
    const { fetchFn, calls } = recorder([new Response(null, { status: 200, headers })]);
    await expect(createDriveRest({ accessToken: "tok", fetchFn }).uploadNew({ name: "b" }, big, "application/json"))
      .rejects.toMatchObject({ status: 502 });
    expect(calls).toHaveLength(1);
  });

  it.each([
    ["404", 404, "notFound"],
    ["403 rateLimitExceeded", 403, "rateLimitExceeded"],
    ["502", 502, null],
    ["503", 503, null],
  ])("keeps status and reason for Drive %s", async (_label, status, reason) => {
    const body = reason === null ? "<html>" : JSON.stringify({ error: { errors: [{ reason }] } });
    const { fetchFn } = recorder([new Response(body, { status })]);
    await expect(createDriveRest({ accessToken: "tok", fetchFn }).listAll({ q: "trashed=false" }))
      .rejects.toMatchObject({ status, reason });
  });
});
