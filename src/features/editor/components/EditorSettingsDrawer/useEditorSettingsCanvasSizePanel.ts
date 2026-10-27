/**
 * Purpose:
 * Canvas-size form behavior: validates width and height on submit, shows inline errors (focusing
 * the first invalid field) and hands a valid size to `onApply`; editing a field clears its error.
 */
"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { shared } from "@/content/shared";
import { MAX_CANVAS_DIMENSION } from "@/features/shared/artwork/artworkLimits";
import { parseCanvasSizeFields } from "@/features/shared/logic/canvasSizeFields";
import type { ICanvasSizeFieldErrors } from "@/features/shared/logic/canvasSizeFields.type";
import type { IEditorSettingsCanvasSizePanelProps } from "./EditorSettingsCanvasSizePanel.type";

export function useEditorSettingsCanvasSizePanel({
  widthStr,
  heightStr,
  onWidthChange,
  onHeightChange,
  onApply,
}: IEditorSettingsCanvasSizePanelProps) {
  const [errors, setErrors] = useState<ICanvasSizeFieldErrors>({});
  const widthRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);

  return {
    errors,
    widthRef,
    heightRef,
    maxDimension: MAX_CANVAS_DIMENSION,
    changeWidth: (event: ChangeEvent<HTMLInputElement>) => {
      onWidthChange(event.target.value);
      setErrors((prev) => ({ ...prev, width: undefined }));
    },
    changeHeight: (event: ChangeEvent<HTMLInputElement>) => {
      onHeightChange(event.target.value);
      setErrors((prev) => ({ ...prev, height: undefined }));
    },
    submit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const { size, errors: fieldErrors } = parseCanvasSizeFields(
        widthStr,
        heightStr,
        MAX_CANVAS_DIMENSION,
        shared.numberField.range(1, MAX_CANVAS_DIMENSION),
      );
      setErrors(fieldErrors);
      if (!size) {
        (fieldErrors.width ? widthRef : heightRef).current?.focus();
        return;
      }
      onApply(size);
    },
  };
}
