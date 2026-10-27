/** Page metadata for the whole app. */
export interface ISiteContent {
  name: string;
  description: string;
  metaDescription: string;
  /** Production origin, no trailing slash; the base for canonical, sitemap and social URLs. */
  url: string;
  author: string;
  email: string;
  repoUrl: string;
  issuesUrl: string;
}

/** Copy for the site shell: header, menu, theme toggle and footer. */
export interface IShellContent {
  skipToContent: string;
  nav: {
    gallery: string;
    help: string;
    about: string;
    contact: string;
    github: string;
    label: string;
  };
  menu: { open: string; title: string };
  theme: { toDark: string; toLight: string };
  primary: { start: string; startCompact: string };
  account: {
    sectionTitle: string;
    signIn: string;
    openAccount: string;
    signOut: string;
    signInAgain: string;
    reauthNote: string;
  };
  footer: { tagline: string; credit: string; copyright: string; linksLabel: string };
}

/** An icon control: its accessible name and its tooltip. */
export interface ILabeledControl {
  label: string;
  title: string;
}

/** An icon button: its accessible name and, when it has one, its keyboard shortcut for the tooltip. */
export interface IIconControl {
  label: string;
  shortcut?: string;
}

export interface ISharedContent {
  loading: string;
  actions: {
    save: string;
    cancel: string;
    apply: string;
    close: string;
    add: string;
    remove: string;
    rename: string;
  };
  fields: {
    width: string;
    height: string;
  };
  toast: {
    dismissLabel: string;
  };
  sideDrawer: {
    /** Backdrop button name when the caller doesn't pass its own. */
    closeLabel: string;
  };
  iconButton: {
    /** Tooltip of an icon button that has a keyboard shortcut. */
    titleWithShortcut: (label: string, shortcut: string) => string;
  };
  modal: {
    /** Name of the click-outside button behind a dialog panel. */
    backdropLabel: string;
  };
  numberField: {
    /** Inline error on a NumberField whose value is not a whole number from min to max. */
    range: (min: number, max: number) => string;
  };
  colorField: {
    /** Accessible name of the swatch that opens the native picker, from the field label. */
    pickerLabel: (label: string) => string;
    /** Inline error on a hex value that is not #RGB or #RRGGBB. */
    invalid: string;
  };
  theme: {
    /** Name of the theme switch (visible in settings rows, screen-reader only in headers). */
    label: string;
    /** One label per theme the control offers (THEME_OPTIONS). */
    options: { light: string; dark: string };
  };
  colorSwatch: {
    compactTitle: (position: number) => string;
    comfortableTitle: (position: number) => string;
    /** Accessible name: position, hex value, and the painting slots the color fills. */
    selectLabel: (
      position: number,
      color: string,
      slots?: { primary?: boolean; secondary?: boolean },
    ) => string;
  };
  artwork: {
    /** Title given to an artwork whose title is blank. */
    untitled: string;
    /** Name of the layer every new artwork starts with. */
    backgroundLayer: string;
    copyTitle: (title: string) => string;
    errors: {
      dimensionsOutOfRange: (max: number) => string;
      invalidBackgroundColor: string;
      backgroundPaletteFull: string;
      importedPaletteEmpty: string;
      paletteTooLarge: (max: number) => string;
    };
  };
  /** Errors from reading and writing artwork files (JSON import, PNG export). */
  artworkFile: {
    errors: {
      invalidFormat: string;
      canvasUnavailable: string;
      invalidJson: string;
    };
  };
}

export interface IGalleryContent {
  metaDescription: string;
  screen: {
    heading: string;
    countLabel: (n: number) => string;
    storageNote: string;
    storageLink: string;
    importFile: string;
    /** Accessible name of the Import file button. */
    importLabel: string;
    newArtwork: string;
    /** Phone label of the header's primary action. */
    newCompact: string;
  };
  grid: {
    emptyTitle: string;
    emptyText: string;
  };
  card: {
    clone: string;
    size: (w: number, h: number) => string;
    edited: (relative: string) => string;
    justNow: string;
    /** Separates the size from the edited time in the meta line. */
    metaSeparator: string;
    delete: string;
    /** Accessible name of the inline rename field. */
    titleLabel: string;
    /** Accessible name of the artwork actions menu. */
    actionsLabel: (title: string) => string;
  };
  create: {
    title: string;
    titleLabel: string;
    backgroundLabel: string;
    /** Legend of the size group (presets plus width and height). */
    sizeLabel: string;
    /** Accessible name of the preset group. */
    sizePresetsLabel: string;
    /** Accessible name of one square preset. */
    sizePresetLabel: (size: number) => string;
    /** The form's one hint: size limit and what happens to a new background color. */
    hint: (max: number) => string;
    submit: string;
    submitting: string;
  };
  import: {
    success: string;
    failed: string;
  };
  errors: {
    load: string;
    create: string;
    import: string;
    rename: string;
    clone: string;
    delete: string;
  };
  toasts: { duplicated: string };
  deleteDialog: {
    /** Names the artwork being deleted. */
    title: (title: string) => string;
    description: string;
    confirm: string;
  };
}

export type TShiftDirectionKey = "up" | "down" | "left" | "right";

export interface ISettingsMenuRow {
  label: string;
  hint: string;
}

export interface IEditorContent {
  route: {
    missingId: string;
  };
  screen: {
    notFound: string;
    loadFailed: string;
    /** Browser tab title for an open artwork. */
    documentTitle: (artworkTitle: string) => string;
    backToGallery: string;
    loading: string;
  };
  viewport: {
    label: string;
  };
  toolbar: {
    back: string;
    groupLabel: string;
    undo: IIconControl;
    redo: IIconControl;
    pan: IIconControl;
    bucket: IIconControl;
    picker: IIconControl;
    zoomOut: IIconControl;
    zoomIn: IIconControl;
    shift: IIconControl;
    layers: IIconControl;
    settings: IIconControl;
    slot: {
      primary: string;
      secondary: string;
      label: (slot: string) => string;
      title: string;
    };
  };
  paletteRow: {
    groupLabel: string;
    edit: string;
  };
  picker: {
    /** Next to the pointer when a pick hold leaves the canvas. */
    releaseToCancel: string;
  };
  paletteModal: {
    title: string;
    swatches: string;
    selectedColor: string;
    selectedColorLabel: string;
    addColor: string;
    newColorLabel: string;
    /** Outline button that appends the new color. */
    addButton: string;
    paletteFull: string;
    colorExists: string;
  };
  shiftOverlay: {
    closeLabel: string;
    dialogLabel: string;
    groupLabel: string;
    directions: Record<TShiftDirectionKey, ILabeledControl>;
  };
  settings: {
    titles: {
      menu: string;
      canvasSize: string;
      imageDetail: string;
      importExport: string;
    };
    backLabel: string;
    closeLabel: string;
    navLabel: string;
    menu: {
      grid: { label: string };
      referenceImage: { label: string; unavailable: string };
      loadImage: ISettingsMenuRow;
      canvasSize: { label: string; hint: (width: number, height: number) => string };
      export: ISettingsMenuRow;
      imageDetail: ISettingsMenuRow;
    };
    canvasSize: {
      hint: string;
    };
    imageDetail: {
      noIntersection: string;
      summary: (compositePixels: number, visibleCells: number) => string;
      emptyViewport: string;
      allTransparent: string;
      paletteEntry: (index: number) => string;
      percent: (value: number) => string;
    };
    export: {
      hint: string;
      sectionLabel: string;
      title: string;
      png: string;
      json: string;
      jsonDone: string;
      pngDone: string;
      pngFailed: string;
    };
  };
  layers: {
    /** Name of a duplicated layer. */
    copyName: (name: string) => string;
    title: string;
    closeLabel: string;
    add: string;
    footer: string;
    newLayerName: (position: number) => string;
    item: {
      dragTitle: string;
      reorder: string;
      show: string;
      hide: string;
      duplicate: string;
      rename: string;
      delete: string;
    };
    renameModal: {
      title: string;
      nameLabel: string;
      /** Inline error when the name is blank. */
      emptyError: string;
    };
    deleteDialog: {
      title: (name: string) => string;
      description: string;
      confirm: string;
    };
  };
  toasts: {
    /** Stable text so the toast stack can dedupe repeats by exact message. */
    hiddenLayer: string;
  };
  referenceImage: {
    errors: {
      read: string;
      decode: string;
      canvas: string;
    };
  };
  canvasShrinkDialog: {
    title: (width: number, height: number) => string;
    description: (width: number, height: number) => string;
    /** Shown as a highlighted note: the consequence that makes the crop irreversible. */
    warning: string;
    confirm: string;
  };
  paletteRemoval: {
    removed: (color: string) => string;
    /** Asked only when pixels use the color: what those pixels become. */
    dialog: {
      title: (color: string) => string;
      description: (pixelCount: number) => string;
      replaceWith: string;
      transparent: string;
      confirm: string;
    };
  };
}

/** A titled blurb: a Home promise or a How-it-works step. */
export interface IHomeBlurb {
  title: string;
  text: string;
}

/** Copy for the Home page. */
export interface IHomeContent {
  metaTitle: { absolute: string };
  metaDescription: string;
  h1: string;
  lead: string;
  primary: string;
  secondary: string;
  promises: IHomeBlurb[];
  insideLabel: string;
  insideIntro: string;
  inside: IHomeBlurb[];
  stepsTitle: string;
  steps: IHomeBlurb[];
  storageNote: string;
  storageLink: string;
  closingTitle: string;
  closingText: string;
  closingCta: string;
}

/** Copy for the About page. */
export interface IAboutContent {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  sections: { id: string; title: string; paragraphs: string[] }[];
  feedbackLink: string;
  githubLink: string;
  signature: string;
}

/** Copy for the Feedback & contact page. */
export interface IContactContent {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  issue: { title: string; text: string; cta: string };
  email: { title: string; cta: string };
  tip: string;
}

/** A keyboard combination, described independently of platform. `mod` is Cmd on Apple devices and Ctrl elsewhere. */
export interface IKeyCombo {
  /** A single letter ("z"), "Space", "Arrows" or "Alt" (Option on Apple). */
  key: string;
  mod?: boolean;
  shift?: boolean;
}

/** One documented keyboard shortcut; `effect` ties it to behavior checked against the editor's key handling. */
export interface IHelpShortcut {
  action: string;
  combo: IKeyCombo;
  effect: "undo" | "redo" | "toggleGrid" | "spacePan" | "arrowPan" | "altPick";
  note?: string;
}

/** Copy for the Help page. */
export interface IHelpContent {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** Accessible name of the table-of-contents landmark. */
  tocLabel: string;
  intro: string;
  sections: { id: string; title: string; paragraphs: string[] }[];
  shortcutsTitle: string;
  shortcutsIntro: string;
  shortcutColumns: { action: string; keys: string };
  /** Display names of the keys that have no glyph. */
  keyNames: { ctrl: string; shift: string; space: string; arrows: string; alt: string };
  shortcuts: IHelpShortcut[];
  contactPrompt: string;
  contactLink: string;
}

/** Copy for the 404 and error pages. */
export interface IStatusPagesContent {
  metaTitle: string;
  notFound: { title: string; text: string };
  error: { title: string; text: string; retry: string };
  gallery: string;
  home: string;
}
