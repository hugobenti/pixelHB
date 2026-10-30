import type { TExportScale } from "@/features/shared/artwork/exportScale.type";
import type { IArtworkLayer } from "@/features/shared/artwork/artwork.type";

export interface IArtworkFileV1 {
  version: 1;
  title: string;
  width: number;
  height: number;
  palette: string[];
  layers: Array<{
    id: string;
    name: string;
    visible: boolean;
    pixelData: number[];
  }>;
  activeLayerId: string;
  referenceImageDataUrl?: string;
}

export interface IArtworkFileV2 {
  version: 2;
  title: string;
  width: number;
  height: number;
  palette: string[];
  layers: Array<{
    id: string;
    name: string;
    visible: boolean;
    pixelDataBase64: string;
  }>;
  activeLayerId: string;
  referenceImageDataUrl?: string;
}

export interface IArtworkFileV3 {
  version: 3;
  id: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  width: number;
  height: number;
  palette: string[];
  layers: Array<{
    id: string;
    name: string;
    visible: boolean;
    pixelDataBase64: string;
  }>;
  activeLayerId: string;
  referenceImageDataUrl?: string;
}

export type TArtworkFile = IArtworkFileV1 | IArtworkFileV2 | IArtworkFileV3;

export interface IArtworkFileMeta {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface IParsedArtworkFile {
  /** Present only for v3 files; v1/v2 carry no identity. */
  meta: IArtworkFileMeta | null;
  data: IImportedArtworkData;
}

export interface IImportedArtworkData {
  title: string;
  width: number;
  height: number;
  palette: string[];
  layers: IArtworkLayer[];
  activeLayerId: string;
  referenceImageDataUrl?: string;
}

export interface IExportPngOptions {
  scale: TExportScale;
  /** Whether to draw the credit strip; not drawn yet, so results always report `false`. */
  credit: boolean;
}

export interface IRenderedPng {
  blob: Blob;
  /** True when a credit strip was drawn. */
  credit: boolean;
  fileName: string;
}
