/**
 * Purpose:
 * Settings drill-in view that provides artwork export controls.
 */
"use client";

import { editor } from "@/content/editor";
import { Button } from "@/features/shared/components/Button";
import { ButtonGroup } from "@/features/shared/components/ButtonGroup";
import { Switch } from "@/features/shared/components/Switch";
import { editorSettingsImportExportPanel } from "./EditorSettingsImportExportPanel.style";
import type { IEditorSettingsImportExportPanelProps } from "./EditorSettingsImportExportPanel.type";

export function EditorSettingsImportExportPanel({
  scaleOptions,
  onSelectScale,
  credit,
  creditHint,
  onCreditChange,
  onShare,
  shareDisabled,
  shareLabel,
  shareSizeLabel,
  downloading,
  onDownloadPng,
  onExportJson,
}: IEditorSettingsImportExportPanelProps) {
  return (
    <div className={editorSettingsImportExportPanel.root}>
      <section className={editorSettingsImportExportPanel.section}>
        <h3 className={editorSettingsImportExportPanel.heading}>
          {editor.settings.export.pngTitle}
        </h3>
        <p className={editorSettingsImportExportPanel.supportingText}>
          {editor.settings.export.pngDescription}
        </p>
        <p className={editorSettingsImportExportPanel.scaleLabel}>
          {editor.settings.export.scaleLabel}
        </p>
        <ButtonGroup
          className={editorSettingsImportExportPanel.scaleGroup}
          aria-label={editor.settings.export.scaleLabel}
        >
          {scaleOptions.map((option) => (
            <span key={option.scale}>
              <Button
                type="button"
                variant="ghost"
                className={editorSettingsImportExportPanel.scaleOption}
                aria-pressed={option.pressed}
                aria-describedby={option.description ? option.descriptionId : undefined}
                disabled={option.disabled}
                onClick={() => onSelectScale(option.scale)}
              >
                {option.label}
              </Button>
              {option.description ? (
                <span id={option.descriptionId} className={editorSettingsImportExportPanel.srOnly}>
                  {option.description}
                </span>
              ) : null}
            </span>
          ))}
        </ButtonGroup>
        <Switch
          checked={credit}
          onCheckedChange={onCreditChange}
          label={editor.settings.export.credit.label}
          hint={creditHint ?? editor.settings.export.credit.hint}
          className={editorSettingsImportExportPanel.creditRow}
        />
        <div className={editorSettingsImportExportPanel.actions}>
          <Button
            type="button"
            variant="primary"
            className={editorSettingsImportExportPanel.button}
            disabled={downloading}
            onClick={onDownloadPng}
          >
            {editor.settings.export.downloadPng}
          </Button>
        </div>
        <p className={editorSettingsImportExportPanel.shareHint}>{shareSizeLabel}</p>
        <div className={editorSettingsImportExportPanel.actions}>
          <Button
            type="button"
            variant="outline"
            className={editorSettingsImportExportPanel.button}
            disabled={shareDisabled}
            onClick={onShare}
          >
            {shareLabel}
          </Button>
        </div>
      </section>

      <section className={editorSettingsImportExportPanel.section}>
        <h3 className={editorSettingsImportExportPanel.heading}>
          {editor.settings.export.artworkTitle}
        </h3>
        <p className={editorSettingsImportExportPanel.supportingText}>
          {editor.settings.export.artworkDescription}
        </p>
        <div className={editorSettingsImportExportPanel.actions}>
          <Button
            type="button"
            variant="outline"
            className={editorSettingsImportExportPanel.button}
            onClick={onExportJson}
          >
            {editor.settings.export.json}
          </Button>
        </div>
      </section>
    </div>
  );
}
