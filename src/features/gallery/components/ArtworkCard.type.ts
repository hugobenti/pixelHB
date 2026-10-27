import type { IArtworkSummary } from "@/features/shared/artwork/artwork.type";

export interface IArtworkCardProps {
  artwork: IArtworkSummary;
  /** Epoch ms the relative edit time is measured against. */
  now: number;
  onRename: (id: string, title: string) => Promise<void>;
  onClone: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
