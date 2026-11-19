"use client";

import { type ComponentPropsWithoutRef, forwardRef, useMemo } from "react";
import { EasingCurveDurationField, EasingCurveEaseField, EasingCurveEditor, EasingCurveGraph, EasingCurvePresets, EasingCurveSurface } from "@/components/ui/easing-curve-editor";
import { type MotionSpring, springAt, springOvershoot, springSettleTime } from "./motion-inspector-math";
import { MotionChoiceRow, MotionSlider } from "./motion-inspector-parts";
import { useMotionInspector } from "./motion-inspector-state";
import { cn } from "@/lib/utils";

type PartProps = Omit<ComponentPropsWithoutRef<"div">, "children" | "defaultValue">;

/** Presets, the curve, the Ease field and Duration. It shows while the value is an easing. */
export const MotionInspectorEasing = forwardRef<HTMLDivElement, Omit<PartProps, "onDurationChange">>(function MotionInspectorEasing({ className, ...props }, ref) {
  const { value, mixed, disabled, readOnly, ranges, container, messages, preview, commit } = useMotionInspector();
  if (value?.type !== "easing") return null;
  return (
    <EasingCurveEditor
      ref={ref}
      label={messages.easing}
      value={value.curve}
      duration={value.duration}
      durationRange={ranges.duration}
      mixed={mixed}
      disabled={disabled}
      readOnly={readOnly}
      container={container}
      messages={{ preset: messages.preset, duration: messages.duration, mixed: messages.mixed }}
      className={cn("w-full", className)}
      onValueChange={(curve) => preview({ curve }, "curve")}
      onValueCommit={(curve) => commit({ curve }, "curve")}
      onDurationChange={(duration) => preview({ duration }, "duration")}
      onDurationCommit={(duration) => commit({ duration }, "duration")}
      {...props}
    >
      <EasingCurveSurface />
      <EasingCurvePresets />
      <EasingCurveEaseField />
      <EasingCurveDurationField />
    </EasingCurveEditor>
  );
});

type GraphProps = PartProps & { spring: MotionSpring };

/** A read-only curve of a spring from start until it settles. */
export function MotionInspectorSpringGraph({ spring, className, ...props }: GraphProps) {
  const { value, shown, mixed, messages } = useMotionInspector();
  const key = JSON.stringify(spring);
  const { easing, range } = useMemo(() => {
    const current = JSON.parse(key) as MotionSpring;
    const settle = springSettleTime(current);
    return { easing: (time: number) => springAt(current, time * settle), range: [-0.25, Math.max(1.75, 1.05 + springOvershoot(current))] as const };
  }, [key]);
  return <EasingCurveGraph label={messages.springCurve} easing={easing} range={range} samples={160} className={cn("w-full", mixed && shown === value && "opacity-40", className)} {...props} />;
}

/** Time or Physics, the spring's curve and its fields. It shows while the value is a spring. */
export const MotionInspectorSpring = forwardRef<HTMLDivElement, PartProps>(function MotionInspectorSpring({ className, ...props }, ref) {
  const { value, shown, ranges, messages, chooseDefinedBy } = useMotionInspector();
  if (value?.type !== "spring" || shown?.type !== "spring") return null;
  return (
    <div ref={ref} data-slot="motion-inspector-spring" className={cn("grid min-w-0 gap-2", className)} {...props}>
      <MotionInspectorSpringGraph spring={shown} />
      <MotionChoiceRow
        data-slot="motion-inspector-defined-by"
        label={messages.definedBy}
        value={value.definedBy}
        options={[
          { value: "time", label: messages.time },
          { value: "physics", label: messages.physics },
        ]}
        onCommit={chooseDefinedBy}
      />
      {value.definedBy === "time" ? (
        <>
          <MotionSlider field="duration" label={messages.duration} value={value.duration} range={ranges.duration} />
          <MotionSlider field="bounce" label={messages.bounce} value={value.bounce} range={ranges.bounce} />
        </>
      ) : (
        <>
          <MotionSlider field="stiffness" label={messages.stiffness} value={value.stiffness} range={ranges.stiffness} />
          <MotionSlider field="damping" label={messages.damping} value={value.damping} range={ranges.damping} />
          <MotionSlider field="mass" label={messages.mass} value={value.mass} range={ranges.mass} />
        </>
      )}
    </div>
  );
});
