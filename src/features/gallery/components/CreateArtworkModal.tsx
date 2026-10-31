/**
 * Purpose:
 * Modal dialog to create a new artwork with title, canvas size (square presets or width and height),
 * and background color.
 */
"use client";

import { gallery } from "@/content/gallery";
import { shared } from "@/content/shared";
import { Button } from "@/features/shared/components/Button";
import { ButtonGroup } from "@/features/shared/components/ButtonGroup";
import { ColorField } from "@/features/shared/components/ColorField";
import { FormField } from "@/features/shared/components/FormField";
import { Input } from "@/features/shared/components/Input";
import { Modal } from "@/features/shared/components/Modal";
import { NumberField } from "@/features/shared/components/NumberField";
import { Switch } from "@/features/shared/components/Switch";
import { useCreateArtworkForm } from "@/features/gallery/hooks/useCreateArtworkForm";
import { createArtworkModal } from "./CreateArtworkModal.style";
import type { ICreateArtworkModalProps } from "./CreateArtworkModal.type";

export function CreateArtworkModal({ open, onClose, onCreate }: ICreateArtworkModalProps) {
  const {
    titleId,
    title,
    setTitle,
    width,
    changeWidth,
    height,
    changeHeight,
    presets,
    backgroundColor,
    setBackgroundColor,
    setBackgroundColorValid,
    transparentBackground,
    setTransparentBackground,
    colorFieldKey,
    busy,
    errors,
    widthRef,
    heightRef,
    maxDimension,
    sizeHint,
    backgroundHint,
    handleSubmit,
  } = useCreateArtworkForm({ open, onCreate });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={gallery.create.title}
      size="md"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {shared.actions.cancel}
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? gallery.create.submitting : gallery.create.submit}
          </Button>
        </>
      }
    >
      <FormField label={gallery.create.titleLabel} htmlFor={titleId}>
        <Input
          id={titleId}
          data-autofocus
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          required
        />
      </FormField>
      <fieldset className={createArtworkModal.sizeGroup}>
        <legend className={createArtworkModal.legend}>{gallery.create.sizeLabel}</legend>
        <ButtonGroup
          aria-label={gallery.create.sizePresetsLabel}
          className={createArtworkModal.presets}
        >
          {presets.map((preset) => (
            <button
              key={preset.size}
              type="button"
              aria-pressed={preset.pressed}
              aria-label={preset.label}
              className={createArtworkModal.preset}
              onClick={preset.apply}
            >
              {preset.size}
            </button>
          ))}
        </ButtonGroup>
        <div className={createArtworkModal.sizeFields}>
          <NumberField
            ref={widthRef}
            label={shared.fields.width}
            name="width"
            min={1}
            max={maxDimension}
            value={width}
            onChange={(ev) => changeWidth(ev.target.value)}
            error={errors.width}
          />
          <NumberField
            ref={heightRef}
            label={shared.fields.height}
            name="height"
            min={1}
            max={maxDimension}
            value={height}
            onChange={(ev) => changeHeight(ev.target.value)}
            error={errors.height}
          />
        </div>
      </fieldset>
      <p className={createArtworkModal.hint}>{sizeHint}</p>
      <Switch
        checked={transparentBackground}
        onCheckedChange={setTransparentBackground}
        label={gallery.create.transparentLabel}
      />
      <ColorField
        key={colorFieldKey}
        label={gallery.create.backgroundLabel}
        value={backgroundColor}
        onValueChange={setBackgroundColor}
        onValidityChange={setBackgroundColorValid}
        disabled={transparentBackground}
      />
      <p className={createArtworkModal.hint}>{backgroundHint}</p>
      {errors.form ? (
        <p role="alert" className={createArtworkModal.formError}>
          {errors.form}
        </p>
      ) : null}
    </Modal>
  );
}
