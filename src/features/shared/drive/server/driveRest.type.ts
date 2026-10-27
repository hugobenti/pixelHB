export type TAppProperties = Record<string, string>;

export interface IDriveFile {
  id: string;
  name: string;
  appProperties?: TAppProperties;
}

export interface IDriveFileMetadata {
  name?: string;
  mimeType?: string;
  parents?: string[];
  appProperties?: TAppProperties;
}

export interface IDriveListQuery {
  q: string;
  orderBy?: string;
}

export interface IDriveRestOptions {
  accessToken: string;
  fetchFn: typeof fetch;
}

export interface IDriveRest {
  listAll(query: IDriveListQuery): Promise<IDriveFile[]>;
  createFolder(metadata: IDriveFileMetadata): Promise<IDriveFile>;
  uploadNew(metadata: IDriveFileMetadata, content: Uint8Array, mimeType: string): Promise<IDriveFile>;
  uploadExisting(
    fileId: string,
    metadata: IDriveFileMetadata,
    content: Uint8Array,
    mimeType: string,
  ): Promise<IDriveFile>;
  /** `null` when the file is gone (404). */
  download(fileId: string): Promise<ReadableStream<Uint8Array> | null>;
  /** Moves the file to the Drive trash; a file that is already gone counts as done. */
  trash(fileId: string): Promise<void>;
}

export interface IDriveErrorBody {
  error?: { errors?: Array<{ reason?: unknown }> };
}

export interface IDriveListPage {
  files?: IDriveFile[];
  nextPageToken?: string;
}
