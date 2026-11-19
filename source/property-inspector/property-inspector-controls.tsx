"use client";

import type { ReactNode } from "react";
import { type AlignmentPosition, AlignmentGrid } from "@/components/ui/alignment-control";
import {
  type ColorValue,
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerError,
  ColorPickerEyeDropper,
  ColorPickerField,
  ColorPickerFields,
  ColorPickerHexInput,
  ColorPickerLabel,
  ColorPickerSlider,
  ColorPickerSwatches,
  ColorPickerTrigger,
} from "@/components/ui/color-picker";
import {
  type ImagePickerUpload,
  type ImageValue,
  ImagePicker,
  ImagePickerContent,
  ImagePickerError,
  ImagePickerField,
  ImagePickerLabel,
  ImagePickerLibrary,
  ImagePickerName,
  ImagePickerThumbnail,
  ImagePickerUrlInput,
} from "@/components/ui/image-picker";
import {
  type InspectorFieldSegment,
  InspectorField,
  InspectorFieldActionButton,
  InspectorFieldActions,
  InspectorFieldCheckbox,
  InspectorFieldLabel,
  InspectorFieldMessage,
  InspectorFieldControls,
  InspectorFieldLock,
  InspectorFieldSegments,
  InspectorFieldSelect,
  type InspectorFieldSelectOption,
  InspectorFieldToggle,
  InspectorFieldToggleButton,
} from "@/components/ui/inspector-field";
import { type SplitNumberPreset, type SplitNumberValue, SplitNumberField, SplitNumberFieldParts, SplitNumberFieldToggle } from "@/components/ui/split-number-field";
import { PropertyInspectorField, type PropertyInspectorRowOptions, useInGrid } from "./property-inspector-property";
import { usePropertyInspector } from "./property-inspector-state";
import { cn } from "@/lib/utils";

type RowProps = PropertyInspectorRowOptions & { className?: string };

type SegmentsProps<V extends string | boolean> = Omit<RowProps, "parts"> & {
  /** Each choice, with a label and an optional icon. Icons fill the row; text stays compact. */
  options: InspectorFieldSegment<V>[];
};

/** A choice among a few values, such as Direction, as segments with a sliding highlight. */
export function PropertyInspectorSegments<V extends string | boolean>({ options, ...row }: SegmentsProps<V>) {
  return (
    <PropertyInspectorField<V> {...row}>
      {({ value, commit, cell }) => (
        <InspectorFieldControls>
          {/* In a grid cell the track fills the cell at a field's height. */}
          <InspectorFieldSegments value={value} options={options} className={cn(cell.bare && "h-[var(--uicoolkit-field-height,2.5rem)] w-full")} onCommit={(next) => commit(next)} />
        </InspectorFieldControls>
      )}
    </PropertyInspectorField>
  );
}

type SelectProps = Omit<RowProps, "parts"> & {
  options: InspectorFieldSelectOption[];
  /** A search field that filters the list, for long lists such as fonts. */
  searchable?: boolean;
  /** Draws an option, such as a font in its own face (inspectorFieldFontOption). */
  renderOption?: (option: InspectorFieldSelectOption) => ReactNode;
};

/** A choice from a list, such as Weight, or with searchable a long list such as Font family. */
export function PropertyInspectorSelect({ options, searchable, renderOption, ...row }: SelectProps) {
  const inspector = usePropertyInspector();
  return (
    <PropertyInspectorField<string> {...row}>
      {({ value, commit }) => (
        <InspectorFieldSelect
          value={value ?? ""}
          options={options}
          searchable={searchable}
          renderOption={renderOption}
          container={inspector.container}
          positionMethod="fixed"
          onCommit={(next) => commit(next)}
        />
      )}
    </PropertyInspectorField>
  );
}

/** An on/off property shown as Off and On segments. */
export function PropertyInspectorToggle(row: Omit<RowProps, "parts">) {
  return <PropertyInspectorField<boolean> {...row}>{({ value, commit }) => <InspectorFieldToggle checked={value === true} onCommit={(next) => commit(next)} />}</PropertyInspectorField>;
}

type ToggleButtonProps = Omit<RowProps, "parts"> & {
  /** Names the button, such as "Lock aspect ratio"; shown in its tooltip. */
  buttonLabel: string;
  icon: ReactNode;
};

/** An on/off property shown as one icon button that stays pressed while on, such as Lock aspect ratio. */
export function PropertyInspectorToggleButton({ buttonLabel, icon, ...row }: ToggleButtonProps) {
  return (
    <PropertyInspectorField<boolean> {...row}>
      {({ value, commit }) => (
        <InspectorFieldControls>
          <InspectorFieldToggleButton pressed={value} label={buttonLabel} icon={icon} onCommit={(next) => commit(next)} />
        </InspectorFieldControls>
      )}
    </PropertyInspectorField>
  );
}

type CheckboxProps = Omit<RowProps, "parts"> & {
  /** Shortcut text shown after the label, such as "⌥C". Your app binds the key. */
  shortcut?: string;
};

/** An on/off property as a checkbox across the row, such as Clip content. It needs no box, so it lines up with the fields' edges. */
export function PropertyInspectorCheckbox({ shortcut, className, ...row }: CheckboxProps) {
  return (
    <PropertyInspectorField<boolean> ownLabel {...row} className={cn("before:hidden", className)}>
      {({ value, commit }) => <InspectorFieldCheckbox checked={value} shortcut={shortcut} className="px-0" onCommit={(next) => commit(next)} />}
    </PropertyInspectorField>
  );
}

type SplitNumberProps = Omit<RowProps, "parts"> & {
  /** How the value splits, such as sidesPreset or cornersPreset. Its finest parts are the keys your items store. */
  preset: SplitNumberPreset;
  /** Show the button that splits and merges the parts. Off for a short form, such as a border width whose sides are set elsewhere. */
  expandable?: boolean;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
};

/**
 * A value made of parts, such as padding's sides or radius's corners, in a Split Number Field.
 * Each part merges across the selection on its own, and a commit names the parts it set, so every
 * item keeps its other parts. With the label inside, the parts' icons label the row; with it
 * outside, the label sits above the parts so they keep the full width.
 */
export function PropertyInspectorSplitNumber({ preset, expandable = true, unit, min, max, step, className, ...row }: SplitNumberProps) {
  const inspector = usePropertyInspector();
  const grid = useInGrid();
  // Grid cells always put the label inside.
  const inside = inspector.labelPosition === "inside" || grid;
  const parts = preset.levels[preset.levels.length - 1].map((part) => part.key);
  return (
    // Its parts are boxes already, so with the label inside the row draws no box of its own.
    <PropertyInspectorField<SplitNumberValue> {...row} parts={parts} ownLabel={inside} className={cn(inside && "before:hidden", className)}>
      {({ value, preview, commit, field }) => (
        <SplitNumberField
          label={row.label}
          preset={preset}
          value={value ?? {}}
          unit={unit}
          min={min}
          max={max}
          step={step}
          disabled={field.disabled || field.locked}
          readOnly={field.readOnly}
          motion={inspector.animated}
          messages={{ mixed: inspector.messages.mixed }}
          className={cn(
            // Outside, the parts go below the label for room; a single field without the expand button stays beside it.
            inside ? "[grid-area:1/1/2/3]!" : expandable ? "mt-1.5 [grid-area:2/1/3/3]!" : "[grid-area:control]!",
            // The first column is half the row, so the second starts where the grid's second column
            // does (such as the Alignment Grid above Padding); the expand button takes from the second.
            expandable ? "grid-cols-[calc((100%-0.5rem)/2)_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
          )}
          onValueChange={(next, change) => preview(next, change.changed)}
          onValueCommit={(next, change) => commit(next, change.changed)}
        >
          <SplitNumberFieldParts />
          {/* 32px at the row's end, so it sits in the last icon slot with the chevron, + and −. */}
          {expandable && <SplitNumberFieldToggle className="w-[var(--uicoolkit-field-icon-width,2rem)]" />}
        </SplitNumberField>
      )}
    </PropertyInspectorField>
  );
}

/** Where a layer sits in its frame, as a 3×3 Alignment Grid. A selection in different places shows no position. */
export function PropertyInspectorAlignment({ className, ...row }: Omit<RowProps, "parts">) {
  const inspector = usePropertyInspector();
  return (
    // Taller than a field, so with the label inside the row draws no box around it.
    <PropertyInspectorField<AlignmentPosition> {...row} className={cn(inspector.labelPosition === "inside" && "before:hidden", className)}>
      {({ value, commit, field, cell }) =>
        cell.grid ? (
          // In a grid it fills its cell, two fields tall when it spans two rows.
          <AlignmentGrid
            value={value}
            motion={inspector.animated}
            disabled={field.disabled || field.locked || field.readOnly}
            className={cn("w-full", row.rowSpan === 2 ? "h-[calc(var(--uicoolkit-field-height,2.5rem)*2+0.5rem)]" : "h-[var(--uicoolkit-field-height,2.5rem)]")}
            onValueChange={(next) => commit(next)}
          />
        ) : (
          <div className="flex justify-end py-1">
            <AlignmentGrid value={value} motion={inspector.animated} disabled={field.disabled || field.locked || field.readOnly} onValueChange={(next) => commit(next)} />
          </div>
        )
      }
    </PropertyInspectorField>
  );
}

type ColorProps = Omit<RowProps, "parts"> & {
  /** Colours your app offers, such as the document's colours. */
  swatches?: (string | ColorValue)[];
  /** Replace the picker's contents. Defaults to the format fields, area, eyedropper, hue and opacity sliders and swatches. */
  children?: ReactNode;
  /** Rows at the top of the picker, before its contents, such as a fill's Solid and Image switch. */
  header?: ReactNode;
  /** Opens the picker when the row first renders, such as right after a fill becomes a colour. */
  defaultOpen?: boolean;
};

/** A colour, such as Fill: the hex value and a swatch that opens the Color Picker. Drags preview live. */
export function PropertyInspectorColor({ swatches, children, header, defaultOpen, ...row }: ColorProps) {
  const inspector = usePropertyInspector();
  const grid = useInGrid();
  const inside = inspector.labelPosition === "inside" || grid;
  return (
    <PropertyInspectorField<ColorValue> {...row} ownLabel>
      {({ value, preview, commit, field }) => (
        // The picker's parts join the row's columns: its label in the first, the value in the second.
        <ColorPicker
          label={row.label}
          value={value}
          swatches={swatches}
          defaultOpen={defaultOpen}
          disabled={field.disabled || field.locked}
          readOnly={field.readOnly}
          motion={inspector.animated}
          container={inspector.container}
          messages={{ mixed: inspector.messages.mixed }}
          className="contents"
          onValueChange={(next) => preview(next)}
          onValueCommit={(next) => commit(next)}
        >
          <ColorPickerLabel data-slot="label" className={cn("[grid-area:label]", inside && "pl-3.5")} />
          <ColorPickerField
            className={cn(
              "h-[var(--uicoolkit-field-height,2.5rem)] gap-2 pr-2 [grid-area:control]",
              inside ? "pl-2" : "rounded-md border border-[color:var(--uicoolkit-field-border,var(--input))] bg-[var(--uicoolkit-field-bg,transparent)] pl-3.5 shadow-[var(--uicoolkit-field-shadow,0_1px_2px_0_rgb(0_0_0/0.05))] focus-within:border-ring",
            )}
          >
            <ColorPickerHexInput className="ml-auto" />
            {field.locked ? <InspectorFieldLock /> : <ColorPickerTrigger />}
          </ColorPickerField>
          <ColorPickerError className="mt-1 [grid-area:error]" />
          <ColorPickerContent>
            {header}
            {children ?? (
              <>
                <ColorPickerFields />
                <ColorPickerArea />
                <div className="flex items-center gap-2">
                  <ColorPickerEyeDropper />
                  <div className="grid flex-1 gap-2.5">
                    <ColorPickerSlider channel="hue" />
                    <ColorPickerSlider channel="alpha" />
                  </div>
                </div>
                <ColorPickerSwatches />
              </>
            )}
          </ColorPickerContent>
        </ColorPicker>
      )}
    </PropertyInspectorField>
  );
}

type ImageProps = Omit<RowProps, "parts"> & {
  /** Stores a chosen, dropped or pasted file and resolves with where it lives; it can report progress. */
  onUpload?: ImagePickerUpload;
  /** Images your app already has, such as recent uploads or assets. */
  library?: ImageValue[];
  /** File types allowed, as MIME types, and the largest file in bytes. */
  accept?: string[];
  maxSize?: number;
  /** Rows at the top of the picker, such as a fill's Solid and Image switch. */
  header?: ReactNode;
  /** Rows after the image, such as how it fits its layer. */
  children?: ReactNode;
  /** Opens the picker when the row first renders, such as right after a fill becomes an image. */
  defaultOpen?: boolean;
};

/**
 * An image, such as an image fill: a thumbnail and its name, and pressing the row opens Image
 * Picker to choose, drop, paste, link or pick one from your library. One commit per change.
 */
export function PropertyInspectorImage({ onUpload, library, accept, maxSize, header, children, defaultOpen, ...row }: ImageProps) {
  const inspector = usePropertyInspector();
  const grid = useInGrid();
  const inside = inspector.labelPosition === "inside" || grid;
  return (
    <PropertyInspectorField<ImageValue | null> {...row} ownLabel>
      {({ value, mixed, commit, field }) => (
        // Like the colour row, the picker's parts join the row's columns.
        <ImagePicker
          label={row.label}
          value={value}
          mixed={mixed}
          onUpload={onUpload}
          library={library}
          accept={accept}
          maxSize={maxSize}
          defaultOpen={defaultOpen}
          disabled={field.disabled || field.locked}
          readOnly={field.readOnly}
          motion={inspector.animated}
          container={inspector.container}
          messages={{ mixed: inspector.messages.mixed }}
          className="contents"
          onValueCommit={(next) => commit(next)}
        >
          <ImagePickerLabel data-slot="label" className={cn("[grid-area:label]", inside && "pl-3.5")} />
          <ImagePickerField
            className={cn(
              "h-[var(--uicoolkit-field-height,2.5rem)] w-full rounded-md pr-2 [grid-area:control]",
              inside ? "justify-end pl-2" : "border border-[color:var(--uicoolkit-field-border,var(--input))] bg-[var(--uicoolkit-field-bg,transparent)] pl-2 shadow-[var(--uicoolkit-field-shadow,0_1px_2px_0_rgb(0_0_0/0.05))] focus-visible:border-ring",
            )}
          >
            {inside ? (
              <>
                <ImagePickerName className="flex-none text-right" />
                <ImagePickerThumbnail />
              </>
            ) : (
              <>
                <ImagePickerThumbnail />
                <ImagePickerName />
              </>
            )}
            {field.locked && <InspectorFieldLock />}
          </ImagePickerField>
          <ImagePickerContent>
            {header}
            {/* Compact: the grid is the preview, with Upload first and Remove beside its heading. */}
            <ImagePickerLibrary>
              <ImagePickerUrlInput />
            </ImagePickerLibrary>
            <ImagePickerError />
            {children}
          </ImagePickerContent>
        </ImagePicker>
      )}
    </PropertyInspectorField>
  );
}

type ActionsProps = {
  /** Names the group of actions, such as "Transform". Read by screen readers; shown only outside a grid. */
  label: string;
  /** In a PropertyInspectorGrid: how many columns and rows the actions cover. */
  span?: number;
  rowSpan?: number;
  className?: string;
  /** PropertyInspectorAction buttons. */
  children: ReactNode;
};

/**
 * A row of one-shot actions on the selection, such as Rotate 90° and the flips: nothing stays
 * pressed, and each press reports the selected ids once. One tab stop; arrow keys move between them.
 */
export function PropertyInspectorActions({ label, span, rowSpan, className, children }: ActionsProps) {
  const inspector = usePropertyInspector();
  const grid = useInGrid();
  return (
    <InspectorField
      label={label}
      disabled={inspector.disabled}
      motion={inspector.animated}
      labelPosition={grid ? "inside" : inspector.labelPosition}
      // In a grid the buttons are the whole cell, with their own track in place of the row's box.
      className={cn(grid && "before:hidden", className)}
      style={grid ? { gridColumn: span ? `span ${span}` : undefined, gridRow: rowSpan ? `span ${rowSpan}` : undefined } : undefined}
    >
      <InspectorFieldLabel className={cn(grid && "sr-only")} />
      {grid ? (
        // Buttons share the cell's width, narrower than their usual minimum when the cell is.
        <InspectorFieldActions className="h-[var(--uicoolkit-field-height,2.5rem)] bg-muted [grid-area:1/1/2/3]! [&_[data-slot=action]]:min-w-0">{children}</InspectorFieldActions>
      ) : (
        <InspectorFieldControls>
          <InspectorFieldActions>{children}</InspectorFieldActions>
        </InspectorFieldControls>
      )}
      <InspectorFieldMessage />
    </InspectorField>
  );
}

type ActionProps = {
  /** Names the action and fills its tooltip, such as "Flip horizontal". */
  label: string;
  icon: ReactNode;
  /** Shortcut text shown in the tooltip, such as "Shift+H". Your app binds the key. */
  shortcut?: string;
  /** Called once per press with every selected id. */
  onAction: (ids: string[]) => void;
};

/** One action in PropertyInspectorActions. */
export function PropertyInspectorAction({ label, icon, shortcut, onAction }: ActionProps) {
  const inspector = usePropertyInspector();
  return <InspectorFieldActionButton label={label} icon={icon} shortcut={shortcut} onAction={() => onAction(inspector.records.map((item) => item.id as string))} />;
}
