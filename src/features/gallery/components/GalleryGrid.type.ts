export type TGalleryCardMarker = "downloading" | "inDrive" | "notSynced" | "tooLarge";

/** One gallery card: a local artwork, or one that so far exists only in Drive. */
export interface IGalleryCard {
  id: string;
  title: string;
  width: number;
  height: number;
  updatedAt: number;
  thumbnail: { src: string; unoptimized: boolean };
  /** False while the artwork is only in Drive. */
  openable: boolean;
  marker: TGalleryCardMarker | null;
}

export interface IGalleryGridProps {
  artworks: IGalleryCard[];
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
