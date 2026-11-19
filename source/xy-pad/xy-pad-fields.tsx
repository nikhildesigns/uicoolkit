"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { NumberField, NumberFieldError, NumberFieldGroup, NumberFieldInput, NumberFieldScrubArea, NumberFieldUnit } from "@/components/ui/number-field";
import { type XYPadAxisName, axisLargeStep, axisPrecision, axisStep } from "./xy-pad-math";
import { useXYPad } from "./xy-pad-state";
import { cn } from "@/lib/utils";

type FieldProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  axis: XYPadAxisName;
};

/** A Number Field for one axis: type, step or drag its label. */
export const XYPadField = forwardRef<HTMLDivElement, FieldProps>(function XYPadField({ axis, className, ...props }, ref) {
  const pad = useXYPad();
  const spec = axis === "x" ? pad.xAxis : pad.yAxis;
  return (
    <NumberField
      ref={ref}
      data-slot="xy-pad-field"
      data-axis={axis}
      className={cn("min-w-0", className)}
      label={spec.label}
      value={pad.value[axis]}
      placeholder={pad.messages.mixed}
      min={spec.min}
      max={spec.max}
      step={axisStep(spec)}
      largeStep={axisLargeStep(spec)}
      precision={axisPrecision(spec)}
      unit={spec.unit}
      disabled={pad.disabled}
      readOnly={pad.readOnly}
      onValueChange={(next) => pad.previewAxis(axis, next)}
      onValueCommit={(next) => pad.commitAxis(axis, next)}
      {...props}
    >
      <NumberFieldGroup>
        <NumberFieldScrubArea className="pl-2 text-xs text-muted-foreground">{spec.shortLabel ?? axis.toUpperCase()}</NumberFieldScrubArea>
        <NumberFieldInput className="min-w-0" />
        <NumberFieldUnit />
      </NumberFieldGroup>
      <NumberFieldError />
    </NumberField>
  );
});

/** A field for each axis, side by side. */
export const XYPadFields = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function XYPadFields({ className, children, ...props }, ref) {
  return (
    <div ref={ref} data-slot="xy-pad-fields" className={cn("grid grid-cols-2 gap-2", className)} {...props}>
      {children ?? (
        <>
          <XYPadField axis="x" />
          <XYPadField axis="y" />
        </>
      )}
    </div>
  );
});
