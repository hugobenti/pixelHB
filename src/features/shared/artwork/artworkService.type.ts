export interface ICreateArtworkInput {
  title: string;
  width: number;
  height: number;
  /** CSS hex for the initial canvas fill (e.g. `#RRGGBB`), added to the palette if missing; `null` is transparent. */
  backgroundColor: string | null;
}
