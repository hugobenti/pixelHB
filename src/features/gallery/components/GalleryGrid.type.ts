import type { IArtworkSummary } from "@/features/shared/artwork/artwork.type";

export interface IGalleryGridProps {
  artworks: IArtworkSummary[];
  now: number;
  /** Show the empty state when there are no artworks. */
  showEmpty: boolean;
  onRename: (id: string, title: string) => Promise<void>;
  onClone: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** Empty-state actions. */
  onCreate: () => void;
  onImport: () => void;
}
