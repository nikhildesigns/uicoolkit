"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { InspectorField, InspectorFieldLabel, InspectorFieldMessage, InspectorFieldSelect, InspectorFieldText } from "@/components/ui/inspector-field";
import { NumberField, NumberFieldError, NumberFieldLabel, NumberFieldSlider, NumberFieldSliderFill, NumberFieldSliderThumb, NumberFieldValue } from "@/components/ui/number-field";
import { parseCurveText, sameCurve } from "./easing-curve-editor-math";
import { useEasingCurveEditor } from "./easing-curve-editor-state";
import { cn } from "@/lib/utils";

const customValue = "custom";
type PartProps = Omit<ComponentPropsWithoutRef<"div">, "children">;

/** A menu of named curves. It shows Custom when the curve matches none of them. */
export const EasingCurvePresets = forwardRef<HTMLDivElement, PartProps>(function EasingCurvePresets({ className, ...props }, ref) {
  const { value, presets, container, mixed, disabled, readOnly, messages, commitCurve } = useEasingCurveEditor();
  const current = presets.find((preset) => sameCurve(preset.curve, value));
  const options = presets.map((preset) => ({ value: preset.value, label: preset.label, disabled: false }));
  if (!current && !mixed) options.push({ value: customValue, label: messages.custom, disabled: true });
  return (
    <InspectorField ref={ref} data-slot="easing-curve-presets" label={messages.preset} labelPosition="inside" mixed={mixed} disabled={disabled} readOnly={readOnly} className={cn("min-w-0 [--uicoolkit-field-bg:var(--muted)] [--uicoolkit-field-border:transparent] [--uicoolkit-field-shadow:none]", className)} {...props}>
      <InspectorFieldLabel />
      <InspectorFieldSelect
        value={current?.value ?? customValue}
        options={options}
        container={container}
        positionMethod={container ? "fixed" : undefined}
        onCommit={(next) => {
          const preset = presets.find((item) => item.value === next);
          if (preset) commitCurve(preset.curve, "preset");
        }}
      />
    </InspectorField>
  );
});

/** All four numbers in one field. It also accepts cubic-bezier() and CSS keywords. */
export const EasingCurveEaseField = forwardRef<HTMLDivElement, PartProps>(function EasingCurveEaseField({ className, ...props }, ref) {
  const { value, range, mixed, disabled, readOnly, messages, commitCurve } = useEasingCurveEditor();
  return (
    <InspectorField ref={ref} data-slot="easing-curve-ease" label={messages.ease} labelPosition="inside" mixed={mixed} disabled={disabled} readOnly={readOnly} className={cn("min-w-0 [--uicoolkit-field-bg:var(--muted)] [--uicoolkit-field-border:transparent] [--uicoolkit-field-shadow:none]", className)} {...props}>
      <InspectorFieldLabel />
      <InspectorFieldText
        value={value.join(", ")}
        validate={(text) => (parseCurveText(text, range) ? null : messages.invalidCurve(range[0], range[1]))}
        onCommit={(text) => {
          const curve = parseCurveText(text, range);
          if (curve) commitCurve(curve, "field");
        }}
      />
      <InspectorFieldMessage />
    </InspectorField>
  );
});

/** A slider for how long the transition runs. Your app owns the value. */
export const EasingCurveDurationField = forwardRef<HTMLDivElement, PartProps>(function EasingCurveDurationField({ className, ...props }, ref) {
  const { duration, durationRange, onDurationChange, onDurationCommit, mixed, disabled, readOnly, messages } = useEasingCurveEditor();
  if (duration === undefined) return null;
  return (
    <NumberField
      ref={ref}
      data-slot="easing-curve-duration"
      className={cn("min-w-0", className)}
      label={messages.duration}
      value={mixed ? null : duration}
      placeholder={messages.mixed}
      min={durationRange.min}
      max={durationRange.max}
      step={durationRange.step}
      unit={durationRange.unit}
      disabled={disabled}
      readOnly={readOnly}
      onValueChange={onDurationChange}
      onValueCommit={(next) => onDurationCommit?.(next)}
      {...props}
    >
      <NumberFieldSlider className="h-[var(--uicoolkit-field-height,2.5rem)]">
        <NumberFieldSliderFill />
        <NumberFieldSliderThumb />
        <NumberFieldLabel />
        <NumberFieldValue />
      </NumberFieldSlider>
      <NumberFieldError />
    </NumberField>
  );
});

/** The Ease field, and the Duration field when your app passes a duration. */
export const EasingCurveFields = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function EasingCurveFields({ className, children, ...props }, ref) {
  return (
    <div ref={ref} data-slot="easing-curve-fields" className={cn("grid gap-2", className)} {...props}>
      {children ?? (
        <>
          <EasingCurveEaseField />
          <EasingCurveDurationField />
        </>
      )}
    </div>
  );
});
