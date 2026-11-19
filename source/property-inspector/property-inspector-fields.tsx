"use client";

import {
  InspectorField,
  InspectorFieldControl,
  InspectorFieldLabel,
  InspectorFieldLock,
  InspectorFieldMessage,
  InspectorFieldText,
  InspectorFieldValue,
} from "@/components/ui/inspector-field";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldError,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  type NumberFieldKeyword,
  NumberFieldKeywordMenu,
  NumberFieldLabel,
  NumberFieldScrubArea,
  NumberFieldStepper,
  NumberFieldUnit,
} from "@/components/ui/number-field";
import { type PropertyInspectorRowOptions, usePropertyInspectorProperty } from "./property-inspector-property";
import { cn } from "@/lib/utils";

type FieldProps = PropertyInspectorRowOptions & {
  /** Classes for the row and its control, so the inspector can adopt a look. */
  className?: string;
  controlClassName?: string;
};

type TextProps = FieldProps & { validate?: (value: string) => string | null | undefined };

/** A text property, such as a name. Enter or leaving commits to every selected item. */
export function PropertyInspectorText({ validate, className, controlClassName, ...field }: TextProps) {
  const { value, commit, field: row, cell } = usePropertyInspectorProperty<string>(field);
  return (
    <InspectorField className={className} {...row}>
      <InspectorFieldLabel>{cell.label}</InspectorFieldLabel>
      <InspectorFieldText className={controlClassName} value={String(value ?? "")} validate={validate} onCommit={(next) => commit(next)} />
      <InspectorFieldMessage />
    </InspectorField>
  );
}

type NumberProps = FieldProps & {
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Named values the property can hold instead of a number, such as Auto, Hug or Fill; a menu in the field picks one. */
  keywords?: readonly NumberFieldKeyword[];
  inputClassName?: string;
};

/**
 * A number property, such as X or Width, hosted in Number Field: drag the label, type or step.
 * Drags preview live through onPreview and commit once on release. With keywords, the value can
 * also be one of them, chosen from a menu in place of the stepper. A grid cell has no stepper, as in
 * design tools; its value still steps with the arrow keys and by dragging the label.
 */
export function PropertyInspectorNumber({ unit, min, max, step, keywords, className, controlClassName, inputClassName, ...field }: NumberProps) {
  const { value, preview, commit, field: row, cell } = usePropertyInspectorProperty<number | string>(field);
  return (
    <InspectorField className={className} {...row}>
      <InspectorFieldControl>
        {({ props: control, describedBy, locked, align }) => (
          <NumberField
            {...control}
            className="contents"
            unit={unit}
            min={min}
            max={max}
            step={step}
            keywords={keywords}
            value={value}
            onValueChange={(next) => preview(next)}
            onValueCommit={(next) => commit(next)}
          >
            {/* A grid cell is narrow, so its label and value sit closer together. */}
            <NumberFieldScrubArea className={cell.grid ? "pr-1! pl-2.5!" : undefined}>
              <NumberFieldLabel>{cell.label}</NumberFieldLabel>
            </NumberFieldScrubArea>
            <NumberFieldGroup className={controlClassName}>
              <NumberFieldInput className={cn(align === "start" && "text-start", cell.grid && "pr-0.5 pl-0", inputClassName)} aria-describedby={describedBy} />
              <NumberFieldUnit />
              {locked ? (
                <InspectorFieldLock className="mr-3" />
              ) : keywords?.length ? (
                <NumberFieldKeywordMenu compact={cell.grid} />
              ) : cell.grid ? null : (
                <NumberFieldStepper>
                  <NumberFieldIncrement />
                  <NumberFieldDecrement />
                </NumberFieldStepper>
              )}
            </NumberFieldGroup>
            <NumberFieldError />
          </NumberField>
        )}
      </InspectorFieldControl>
      <InspectorFieldMessage />
    </InspectorField>
  );
}

type ValueProps = FieldProps & { format?: (value: unknown) => string };

/** A read-only property, such as a status set elsewhere. */
export function PropertyInspectorValue({ format, className, controlClassName, ...field }: ValueProps) {
  const { value, field: row, cell } = usePropertyInspectorProperty(field);
  return (
    <InspectorField className={className} {...row} readOnly>
      <InspectorFieldLabel>{cell.label}</InspectorFieldLabel>
      <InspectorFieldValue className={controlClassName}>{format ? format(value) : String(value ?? "")}</InspectorFieldValue>
      <InspectorFieldMessage />
    </InspectorField>
  );
}
