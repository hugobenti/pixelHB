/** What the editor screen currently shows. */
export interface IEditorLoaded {
  artworkId: string;
  signedIn: boolean;
}

/** What the editor screen is about to show. */
export interface IEditorLoadTarget {
  artworkId: string;
  signedIn: boolean;
}
