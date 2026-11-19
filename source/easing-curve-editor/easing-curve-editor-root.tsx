"use client";

import { type KeyboardEvent, forwardRef, useRef, useState } from "react";
import { useEasingCurveDrag } from "./easing-curve-editor-drag";
import { EasingCurveFields, EasingCurvePresets } from "./easing-curve-editor-controls";
import { type EasingCurveHandle, type EasingCurveValue, defaultPresets, defaultRange, handlePoint, moveHandle, sameCurve } from "./easing-curve-editor-math";
import { EasingCurveLabel, EasingCurveSurface } from "./easing-curve-editor-parts";
import { type EasingCurveDetail, type EasingCurveEditorProps, EasingCurveContext, defaultDurationRange, defaultMessages } from "./easing-curve-editor-state";
import { cn } from "@/lib/utils";

const arrowKeys: Record<string, readonly [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };

/** Edits a cubic Bézier easing with two handles. Without children it shows the label, presets, curve and fields. */
export const EasingCurveEditor = forwardRef<HTMLDivElement, EasingCurveEditorProps>(function EasingCurveEditor(
  {
    value,
    onValueChange,
    onValueCommit,
    label,
    range = defaultRange,
    step = 0.01,
    presets = defaultPresets,
    duration,
    onDurationChange,
    onDurationCommit,
    durationRange = defaultDurationRange,
    container,
    mixed = false,
    disabled = false,
    readOnly = false,
    motion = true,
    messages: messageOverrides,
    className,
    children,
    ...props
  },
  ref,
) {
  const messages = { ...defaultMessages, ...messageOverrides };
  const [live, setLive] = useState<EasingCurveValue | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const handleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const editable = !disabled && !readOnly;
  const { activeHandle, pointerFocus, setPointerFocus, surfaceHandlers, isDragging } = useEasingCurveDrag({ value, range, step, enabled: editable, trackRef, handleRefs, setLive, onValueChange, onValueCommit });

  const apply = (next: EasingCurveValue, detail: EasingCurveDetail) => {
    onValueChange?.(next, detail);
    onValueCommit(next, detail);
  };

  const onHandleKeyDown = (event: KeyboardEvent<HTMLDivElement>, handle: EasingCurveHandle) => {
    const direction = arrowKeys[event.key];
    if (!editable || isDragging() || !direction) return;
    event.preventDefault();
    event.stopPropagation();
    setPointerFocus(false);
    const amount = step * (event.shiftKey ? 10 : 1);
    const point = handlePoint(value, handle);
    const next = moveHandle(value, handle, { x: point.x + direction[0] * amount, y: point.y + direction[1] * amount }, range, step);
    if (mixed || !sameCurve(next, value)) apply(next, { handle, source: "keyboard" });
  };

  const commitCurve = (curve: EasingCurveValue, source: "field" | "preset") => {
    if (editable && (mixed || !sameCurve(curve, value))) apply(curve, { handle: null, source });
  };

  return (
    <EasingCurveContext.Provider
      value={{
        value: live ?? value,
        label,
        range,
        step,
        presets,
        duration,
        durationRange,
        onDurationChange,
        onDurationCommit,
        container,
        mixed,
        disabled,
        readOnly,
        motion,
        activeHandle,
        pointerFocus,
        messages,
        trackRef,
        handleRefs,
        surfaceHandlers,
        onHandleKeyDown,
        onHandleBlur: () => setPointerFocus(false),
        commitCurve,
      }}
    >
      <div ref={ref} role="group" aria-label={label} data-slot="easing-curve-editor" data-disabled={disabled ? "" : undefined} className={cn("grid w-60 max-w-full gap-2", className)} {...props}>
        {children ?? (
          <>
            <EasingCurveLabel />
            <EasingCurvePresets />
            <EasingCurveSurface />
            <EasingCurveFields />
          </>
        )}
      </div>
    </EasingCurveContext.Provider>
  );
});
