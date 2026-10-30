/**
 * Purpose:
 * Classes for the EditorSettingsImportExportPanel: export section card and its buttons.
 */

import { settingsPanel } from "./settingsPanel.style";

export const editorSettingsImportExportPanel = {
  root: settingsPanel.root,
  hint: settingsPanel.hint,
  section: "rounded-lg border border-line bg-surface-subtle p-3",
  sectionTitle: "text-sm font-semibold text-fg",
  scaleLabel: "mt-3 text-xs font-medium text-muted",
  scaleGroup: "mt-1.5 flex-wrap",
  scaleOption: "min-h-10 px-2.5 text-xs sm:min-h-9",
  creditRow: "mt-3",
  srOnly: "sr-only",
  actions: "mt-3 flex flex-wrap gap-2",
  button: settingsPanel.actionButton,
};
