export interface IModalAutofocusInput {
  /** The primary pointer is coarse (a finger): focusing a text field raises the on-screen keyboard. */
  coarsePointer: boolean;
  /** The `data-autofocus` target accepts typed text. */
  isTextEntry: boolean;
}

export interface IAutofocusTargetLike {
  tagName: string;
  /** `type` attribute value of an input; ignored for other elements. */
  inputType?: string;
  isContentEditable?: boolean;
}
