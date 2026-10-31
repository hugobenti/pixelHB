/** Where and how large renderCanvas draws: device pixels per art pixel and the top-left offset. */
export interface IRenderViewport {
  scale: number;
  viewOffset: { x: number; y: number };
}

/** `clear: false` paints over what the caller already drew (the editor backdrop); defaults to `true`. */
export interface IRenderOptions {
  clear?: boolean;
}
