/**
 * Purpose:
 * Manage gallery-side JSON import flow and hidden file input wiring.
 */
"use client";

import { useCallback, useRef } from "react";

import { gallery } from "@/content/gallery";
import { capture } from "@/features/shared/analytics/analytics";
import { importArtworkFromJsonFile } from "@/features/shared/artwork/artworkFileService";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";
import type { IUseGalleryImportParams } from "./useGalleryImport.type";

export function useGalleryImport({ importArtwork, onImported }: IUseGalleryImportParams) {
  const { showToast } = useToast();
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const openImportPicker = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const onImportFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }
      try {
        const importedData = await importArtworkFromJsonFile(file);
        const created = await importArtwork(importedData);
        if (!created) {
          return;
        }
        capture("import_json");
        showToast({ message: gallery.import.success, tone: "success" });
        onImported(created);
      } catch {
        showToast({ message: gallery.import.failed, tone: "error" });
      }
    },
    [importArtwork, onImported, showToast],
  );

  return { importInputRef, openImportPicker, onImportFile };
}
