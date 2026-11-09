/**
 * Purpose:
 * Classes for the EditorSettingsImportExportPanel: export section card and its buttons.
 */

import { pressedState } from "@/features/shared/components/pressedState.style";
import { cx } from "@/features/shared/utils/cx";
import { settingsPanel } from "./settingsPanel.style";

export const editorSettingsImportExportPanel = {
  root: "flex flex-col gap-5",
  section: "rounded-lg border border-line bg-surface-subtle p-3",
  heading: "text-base font-semibold text-fg",
  supportingText: "mt-1 text-sm leading-relaxed text-fg-secondary",
  scaleLabel: "mt-4 text-xs font-medium text-muted",
  scaleGroup: "mt-1.5 flex-wrap",
  scaleOption: cx("min-h-10 px-2.5 text-xs sm:min-h-9", pressedState),
  creditRow: "mt-3",
  srOnly: "sr-only",
  shareHint: "mt-1 text-xs leading-relaxed text-subtle",
  actions: "mt-3 flex flex-wrap gap-2",
  button: settingsPanel.actionButton,
};
