import type { IGalleryCard } from "./GalleryGrid.type";

export interface IArtworkCardProps {
  artwork: IGalleryCard;
  /** Epoch ms the relative edit time is measured against. */
  now: number;
  onRename: (id: string, title: string) => Promise<void>;
  onClone: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
