/**
 * Purpose:
 * Render the export PNG ahead of time while the Export panel is open, so Share never waits on it.
 *
 * Notes:
 * Renders on mount and 300 ms after the scale, credit or `updatedAt` changes. A result is only
 * returned while it matches the current inputs, so a stale or in-flight render reads as `null`.
 */
"use client";

import { useEffect, useRef, useState } from "react";

import { renderArtworkPng } from "@/features/shared/artwork/artworkFileService";
import type { IPreparedPngEntry, IUsePreparedPngParams } from "./usePreparedPng.type";

const RERENDER_DELAY_MS = 300;

export function usePreparedPng({ artwork, scale, credit, active, onError }: IUsePreparedPngParams) {
  const [entry, setEntry] = useState<IPreparedPngEntry | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const artworkRef = useRef(artwork);
  const onErrorRef = useRef(onError);
  const renderedOnce = useRef(false);
  const key = `${scale}|${credit}|${artwork.updatedAt}`;

  useEffect(() => {
    artworkRef.current = artwork;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!active) {
      renderedOnce.current = false;
      return;
    }
    let stale = false;
    const timer = setTimeout(
      () => {
        renderedOnce.current = true;
        renderArtworkPng(artworkRef.current, { scale, credit }).then(
          (rendered) => {
            if (stale) {
              return;
            }
            const file = new File([rendered.blob], rendered.fileName, { type: "image/png" });
            setEntry({
              key,
              png: {
                blob: rendered.blob,
                file,
                fileName: rendered.fileName,
                credit: rendered.credit,
              },
            });
          },
          (error: unknown) => {
            if (!stale) {
              setFailedKey(key);
              onErrorRef.current?.(error);
            }
          },
        );
      },
      renderedOnce.current ? RERENDER_DELAY_MS : 0,
    );
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [active, key, scale, credit]);

  const ready = active && entry?.key === key;
  return {
    png: ready ? entry.png : null,
    /** True while the latest render for the current inputs has failed. */
    failed: active && !ready && failedKey === key,
  };
}
