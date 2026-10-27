/**
 * Purpose:
 * Form state and submit flow for the “new artwork” dialog (title, size with square presets,
 * background color).
 */
"use client";

import { useCallback, useId, useRef, useState, type FormEvent } from "react";

import { gallery } from "@/content/gallery";
import { shared } from "@/content/shared";
import { MAX_CANVAS_DIMENSION } from "@/features/shared/artwork/artworkLimits";
import { DEFAULT_PALETTE } from "@/features/shared/artwork/artworkService";
import { parseCanvasSizeFields } from "@/features/shared/logic/canvasSizeFields";
import type {
  TCreateArtworkFormErrors,
  TUseCreateArtworkFormOptions,
} from "./useCreateArtworkForm.type";

/** Square sizes offered as one-tap presets (the most common pixel-art canvases). */
const SIZE_PRESETS = [16, 32, 64, 128];

export function useCreateArtworkForm({ open, onCreate }: TUseCreateArtworkFormOptions) {
  const titleId = useId();
  const [title, setTitle] = useState(shared.artwork.untitled);
  const [width, setWidth] = useState("64");
  const [height, setHeight] = useState("64");
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_PALETTE[1] ?? "#FFFFFF");
  const [backgroundColorValid, setBackgroundColorValid] = useState(true);
  const [wasOpen, setWasOpen] = useState(open);
  /** Bumped on every open; keys the ColorField so it remounts even if reopened mid exit-fade. */
  const [openCount, setOpenCount] = useState(0);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setBackgroundColorValid(true);
      setOpenCount((count) => count + 1);
    }
  }
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<TCreateArtworkFormErrors>({});
  const widthRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!backgroundColorValid) return;
      const { size, errors: fieldErrors } = parseCanvasSizeFields(
        width,
        height,
        MAX_CANVAS_DIMENSION,
        shared.numberField.range(1, MAX_CANVAS_DIMENSION),
      );
      setErrors(fieldErrors);
      if (!size) {
        (fieldErrors.width ? widthRef : heightRef).current?.focus();
        return;
      }
      setBusy(true);
      try {
        const createError = await onCreate({ title, backgroundColor, ...size });
        if (createError) {
          setErrors({ form: createError });
        }
      } finally {
        setBusy(false);
      }
    },
    [title, width, height, backgroundColor, backgroundColorValid, onCreate],
  );

  const changeWidth = (value: string) => {
    setWidth(value);
    setErrors((prev) => ({ ...prev, width: undefined }));
  };
  const changeHeight = (value: string) => {
    setHeight(value);
    setErrors((prev) => ({ ...prev, height: undefined }));
  };

  return {
    titleId,
    title,
    setTitle,
    width,
    changeWidth,
    height,
    changeHeight,
    presets: SIZE_PRESETS.map((size) => ({
      size,
      label: gallery.create.sizePresetLabel(size),
      pressed: width.trim() === String(size) && height.trim() === String(size),
      apply: () => {
        changeWidth(String(size));
        changeHeight(String(size));
      },
    })),
    backgroundColor,
    setBackgroundColor,
    setBackgroundColorValid,
    colorFieldKey: openCount,
    busy,
    errors,
    widthRef,
    heightRef,
    maxDimension: MAX_CANVAS_DIMENSION,
    hint: gallery.create.hint(MAX_CANVAS_DIMENSION),
    handleSubmit,
  };
}
