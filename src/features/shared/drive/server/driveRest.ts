/**
 * Purpose:
 * Minimal Google Drive REST v3 client (list, create, update, download, trash) written against an
 * injected `fetch`, so the store tests run without a network.
 *
 * Notes:
 * The access token only ever goes into the `Authorization` header of requests to Google; it is
 * never logged, put in an error message or returned. `fetchFn` is destructured and called as a plain
 * function (calling `options.fetchFn(...)` as a method throws "Illegal invocation" in browsers).
 * Content up to 5 MiB goes in one `multipart/related` request (Drive's documented limit); above that
 * a resumable session is opened and completed with a single `PUT`.
 */
import type {
  IDriveErrorBody,
  IDriveFile,
  IDriveFileMetadata,
  IDriveListPage,
  IDriveListQuery,
  IDriveRest,
  IDriveRestOptions,
} from "./driveRest.type";

const DRIVE_ORIGIN = "https://www.googleapis.com";
const DRIVE_FILES_URL = `${DRIVE_ORIGIN}/drive/v3/files`;
const DRIVE_UPLOAD_URL = `${DRIVE_ORIGIN}/upload/drive/v3/files`;
const FILE_FIELDS = "id,name,appProperties";
const LIST_FIELDS = "nextPageToken,files(id,name,appProperties)";
const LIST_PAGE_SIZE = 1000;
const MULTIPART_MAX_BYTES = 5 * 1024 * 1024;
const BOUNDARY_PREFIX = "pixelhb-";
const JSON_UTF8 = "application/json; charset=UTF-8";
const NETWORK_REASON = "network";
const BAD_RESPONSE_REASON = "badResponse";
const BAD_GATEWAY = 502;

function isGoogleUrl(value: string): boolean {
  try {
    return new URL(value).origin === DRIVE_ORIGIN;
  } catch {
    return false;
  }
}

export class DriveError extends Error {
  readonly status: number;
  readonly reason: string | null;
  readonly retryAfter: string | null;

  constructor(status: number, reason: string | null, retryAfter: string | null) {
    super(`Drive request failed with status ${status}`);
    this.name = "DriveError";
    this.status = status;
    this.reason = reason;
    this.retryAfter = retryAfter;
  }
}

async function errorFromResponse(response: Response): Promise<DriveError> {
  let reason: string | null = null;
  try {
    const body = (await response.json()) as IDriveErrorBody | null;
    const first = body?.error?.errors?.[0]?.reason;
    reason = typeof first === "string" ? first : null;
  } catch {
    reason = null;
  }
  return new DriveError(response.status, reason, response.headers.get("Retry-After"));
}

function fileUrl(base: string, fileId: string, params: Record<string, string>): string {
  return `${base}/${encodeURIComponent(fileId)}?${new URLSearchParams(params)}`;
}

function multipartBody(metadata: IDriveFileMetadata, content: Uint8Array, mimeType: string) {
  const boundary = `${BOUNDARY_PREFIX}${crypto.randomUUID()}`;
  const prefix =
    `--${boundary}\r\nContent-Type: ${JSON_UTF8}\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const suffix = `\r\n--${boundary}--`;
  return {
    contentType: `multipart/related; boundary=${boundary}`,
    body: new Blob([prefix, content as BlobPart, suffix]),
  };
}

export function createDriveRest(options: IDriveRestOptions): IDriveRest {
  const { accessToken, fetchFn } = options;
  const authorization = `Bearer ${accessToken}`;

  async function call(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetchFn(url, init);
    } catch {
      throw new DriveError(0, NETWORK_REASON, null);
    }
  }

  async function authorized(url: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", authorization);
    return call(url, { ...init, headers });
  }

  async function readFile(response: Response): Promise<IDriveFile> {
    try {
      return (await response.json()) as IDriveFile;
    } catch {
      throw new DriveError(BAD_GATEWAY, BAD_RESPONSE_REASON, null);
    }
  }

  async function expectOk(response: Response): Promise<Response> {
    if (!response.ok) {
      throw await errorFromResponse(response);
    }
    return response;
  }

  async function listPage(query: IDriveListQuery, pageToken: string | null): Promise<IDriveListPage> {
    const params = new URLSearchParams({
      q: query.q,
      fields: LIST_FIELDS,
      pageSize: String(LIST_PAGE_SIZE),
      spaces: "drive",
    });
    if (query.orderBy) {
      params.set("orderBy", query.orderBy);
    }
    if (pageToken) {
      params.set("pageToken", pageToken);
    }
    const response = await expectOk(await authorized(`${DRIVE_FILES_URL}?${params}`, {}));
    try {
      return (await response.json()) as IDriveListPage;
    } catch {
      throw new DriveError(BAD_GATEWAY, BAD_RESPONSE_REASON, null);
    }
  }

  async function uploadMultipart(
    method: "POST" | "PATCH",
    url: string,
    metadata: IDriveFileMetadata,
    content: Uint8Array,
    mimeType: string,
  ): Promise<IDriveFile> {
    const { contentType, body } = multipartBody(metadata, content, mimeType);
    const response = await expectOk(
      await authorized(url, { method, headers: { "Content-Type": contentType }, body }),
    );
    return readFile(response);
  }

  async function uploadResumable(
    method: "POST" | "PATCH",
    url: string,
    metadata: IDriveFileMetadata,
    content: Uint8Array,
    mimeType: string,
  ): Promise<IDriveFile> {
    const session = await expectOk(
      await authorized(url, {
        method,
        headers: {
          "Content-Type": JSON_UTF8,
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": String(content.byteLength),
        },
        body: JSON.stringify(metadata),
      }),
    );
    const location = session.headers.get("Location");
    if (!location || !isGoogleUrl(location)) {
      throw new DriveError(BAD_GATEWAY, BAD_RESPONSE_REASON, null);
    }
    // The session URI is itself the credential: the token is not sent to it.
    const response = await expectOk(
      await call(location, {
        method: "PUT",
        redirect: "error",
        headers: { "Content-Type": mimeType },
        body: new Blob([content as BlobPart]),
      }),
    );
    return readFile(response);
  }

  function upload(
    method: "POST" | "PATCH",
    base: string,
    metadata: IDriveFileMetadata,
    content: Uint8Array,
    mimeType: string,
  ): Promise<IDriveFile> {
    const multipart = content.byteLength <= MULTIPART_MAX_BYTES;
    const url = `${base}?${new URLSearchParams({
      uploadType: multipart ? "multipart" : "resumable",
      fields: FILE_FIELDS,
    })}`;
    return multipart
      ? uploadMultipart(method, url, metadata, content, mimeType)
      : uploadResumable(method, url, metadata, content, mimeType);
  }

  return {
    async listAll(query) {
      const files: IDriveFile[] = [];
      let pageToken: string | null = null;
      do {
        const page: IDriveListPage = await listPage(query, pageToken);
        files.push(...(page.files ?? []));
        pageToken = page.nextPageToken ?? null;
      } while (pageToken);
      return files;
    },

    async createFolder(metadata) {
      const response = await expectOk(
        await authorized(`${DRIVE_FILES_URL}?${new URLSearchParams({ fields: FILE_FIELDS })}`, {
          method: "POST",
          headers: { "Content-Type": JSON_UTF8 },
          body: JSON.stringify(metadata),
        }),
      );
      return readFile(response);
    },

    uploadNew: (metadata, content, mimeType) => upload("POST", DRIVE_UPLOAD_URL, metadata, content, mimeType),

    uploadExisting: (fileId, metadata, content, mimeType) =>
      upload("PATCH", `${DRIVE_UPLOAD_URL}/${encodeURIComponent(fileId)}`, metadata, content, mimeType),

    async download(fileId) {
      const response = await authorized(fileUrl(DRIVE_FILES_URL, fileId, { alt: "media" }), {});
      if (response.status === 404) {
        await response.body?.cancel();
        return null;
      }
      await expectOk(response);
      if (!response.body) {
        throw new DriveError(BAD_GATEWAY, BAD_RESPONSE_REASON, null);
      }
      return response.body;
    },

    async trash(fileId) {
      const response = await authorized(fileUrl(DRIVE_FILES_URL, fileId, { fields: "id" }), {
        method: "PATCH",
        headers: { "Content-Type": JSON_UTF8 },
        body: JSON.stringify({ trashed: true }),
      });
      if (response.status === 404) {
        await response.body?.cancel();
        return;
      }
      await expectOk(response);
      await response.body?.cancel();
    },
  };
}
