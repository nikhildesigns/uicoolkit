"use client";

import { type KeyboardEvent, forwardRef, useRef, useState } from "react";
import { XYPadFields } from "./xy-pad-fields";
import { type XYPadAxis, type XYPadAxisName, type XYPadValue, axisLargeStep, axisMiddle, axisStep, changedAxes, sameValue, snapToAxis } from "./xy-pad-math";
import { XYPadLabel, XYPadSurface } from "./xy-pad-parts";
import { useXYPadDrag } from "./xy-pad-drag";
import { type XYPadProps, XYPadContext, defaultMessages } from "./xy-pad-state";
import { cn } from "@/lib/utils";

/** Sets two numbers with one point. Without children it shows the label, the surface and a field for each axis. */
export const XYPad = forwardRef<HTMLDivElement, XYPadProps>(function XYPad(
  { value, onValueChange, onValueCommit, xAxis, yAxis, yDirection = "down", label, disabled = false, readOnly = false, motion = true, messages: messageOverrides, className, children, ...props },
  ref,
) {
  const messages = { ...defaultMessages, ...messageOverrides };
  const [live, setLive] = useState<XYPadValue | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const current = live ?? value;
  const editable = !disabled && !readOnly;
  const { dragging, pointerFocus, setPointerFocus, surfaceHandlers, isDragging } = useXYPadDrag({ value, xAxis, yAxis, yDirection, enabled: editable, trackRef, thumbRef, setLive, onValueChange, onValueCommit });

  const onThumbKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!editable || isDragging()) return;
    const move = (axis: XYPadAxisName, spec: XYPadAxis, direction: number) => {
      const amount = (event.shiftKey ? axisLargeStep(spec) : axisStep(spec)) * direction;
      return { ...value, [axis]: snapToAxis((value[axis] ?? axisMiddle(spec)) + amount, spec) };
    };
    const up = yDirection === "up" ? 1 : -1;
    const moves: Record<string, () => XYPadValue> = {
      ArrowLeft: () => move("x", xAxis, -1),
      ArrowRight: () => move("x", xAxis, 1),
      ArrowUp: () => move("y", yAxis, up),
      ArrowDown: () => move("y", yAxis, -up),
      Home: () => ({ ...value, x: xAxis.min }),
      End: () => ({ ...value, x: xAxis.max }),
    };
    const next = moves[event.key]?.();
    if (!next) return;
    event.preventDefault();
    event.stopPropagation();
    setPointerFocus(false);
    if (sameValue(next, value)) return;
    const detail = { axes: changedAxes(value, next), source: "keyboard" as const };
    onValueChange?.(next, detail);
    onValueCommit(next, detail);
  };

  const previewAxis = (axis: XYPadAxisName, number: number) => {
    const next = { ...value, [axis]: number };
    // A cancelled field drag reports the committed number again, which ends the preview.
    setLive(sameValue(next, value) ? null : next);
    onValueChange?.(next, { axes: [axis], source: "field" });
  };

  const commitAxis = (axis: XYPadAxisName, number: number) => {
    setLive(null);
    if (value[axis] !== number) onValueCommit({ ...value, [axis]: number }, { axes: [axis], source: "field" });
  };

  return (
    <XYPadContext.Provider
      value={{
        value: current,
        committed: value,
        xAxis,
        yAxis,
        yDirection,
        label,
        disabled,
        readOnly,
        dragging,
        pointerFocus,
        motion,
        messages,
        trackRef,
        thumbRef,
        surfaceHandlers,
        onThumbKeyDown,
        onThumbBlur: () => setPointerFocus(false),
        previewAxis,
        commitAxis,
      }}
    >
      <div ref={ref} role="group" aria-label={label} data-slot="xy-pad" data-disabled={disabled ? "" : undefined} className={cn("grid w-40 max-w-full gap-2", className)} {...props}>
        {children ?? (
          <>
            <XYPadLabel />
            <XYPadSurface />
            <XYPadFields />
          </>
        )}
      </div>
    </XYPadContext.Provider>
  );
});
