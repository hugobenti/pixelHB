/** What the editor screen currently shows. */
export interface IEditorLoaded {
  artworkId: string;
  signedIn: boolean;
  /** The signed-in account's id, `null` while signed out. */
  ownerId: string | null;
}

/** What the editor screen is about to show. */
export type TEditorLoadTarget = IEditorLoaded;
