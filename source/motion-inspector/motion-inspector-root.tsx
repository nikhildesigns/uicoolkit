"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { type MotionEasing, type MotionSpring, type MotionValue, convertSpring, defaultRanges, switchType } from "./motion-inspector-math";
import { MotionInspectorDelay, MotionInspectorEmpty, MotionInspectorHeader, MotionInspectorMode } from "./motion-inspector-parts";
import { MotionInspectorEasing, MotionInspectorSpring } from "./motion-inspector-editors";
import { type MotionInspectorDetail, type MotionInspectorProps, type MotionPatch, MotionInspectorContext, defaultMessages } from "./motion-inspector-state";
import { cn } from "@/lib/utils";

const sameValue = (a: MotionValue, b: MotionValue) => JSON.stringify(a) === JSON.stringify(b);

/** Edits how a selected item animates, as an easing curve or a spring. It runs no animation itself. */
export const MotionInspector = forwardRef<HTMLDivElement, MotionInspectorProps>(function MotionInspector(
  { value, onValueCommit, onValueChange, onReplay, label, mixed = false, ranges: rangeOverrides, container, disabled = false, readOnly = false, messages: messageOverrides, className, children, ...props },
  ref,
) {
  const messages = { ...defaultMessages, ...messageOverrides };
  const ranges = { ...defaultRanges, ...rangeOverrides };
  // A live value belongs to the committed value it started from, so a new selection drops it.
  const [live, setLive] = useState<{ base: MotionValue; next: MotionValue } | null>(null);
  const remembered = useRef<{ easing?: MotionEasing; spring?: MotionSpring }>({});

  useEffect(() => {
    if (value?.type === "easing") remembered.current.easing = value;
    if (value?.type === "spring") remembered.current.spring = value;
  }, [value]);

  const merge = (current: MotionValue, patch: MotionPatch) => ({ ...current, ...patch }) as MotionValue;
  const preview = (patch: MotionPatch, field: MotionInspectorDetail["field"]) => {
    if (!value) return;
    const next = merge(value, patch);
    setLive(sameValue(next, value) ? null : { base: value, next });
    onValueChange?.(next, { field });
  };
  const commit = (patch: MotionPatch, field: MotionInspectorDetail["field"]) => {
    if (!value) return;
    setLive(null);
    onValueCommit(merge(value, patch), { field });
  };
  const replace = (next: MotionValue, field: MotionInspectorDetail["field"]) => {
    setLive(null);
    onValueChange?.(next, { field });
    onValueCommit(next, { field });
  };
  const chooseType = (type: MotionValue["type"]) => {
    if (value && (mixed || value.type !== type)) replace(switchType(value, type, remembered.current, ranges), "type");
  };
  const chooseDefinedBy = (definedBy: MotionSpring["definedBy"]) => {
    if (value?.type === "spring" && (mixed || value.definedBy !== definedBy)) replace(convertSpring(value, definedBy, ranges), "definedBy");
  };

  return (
    <MotionInspectorContext.Provider
      value={{
        value,
        shown: value && live?.base === value ? live.next : value,
        label,
        mixed,
        disabled,
        readOnly,
        ranges,
        container,
        messages,
        onReplay,
        preview,
        commit,
        chooseType,
        chooseDefinedBy,
      }}
    >
      <div ref={ref} role="group" aria-label={label} data-slot="motion-inspector" data-mixed={mixed ? "" : undefined} data-disabled={disabled ? "" : undefined} className={cn("grid w-full min-w-0 content-start gap-2 text-sm", className)} {...props}>
        {children ?? (
          <>
            <MotionInspectorHeader />
            <MotionInspectorEmpty />
            <MotionInspectorMode />
            <MotionInspectorEasing />
            <MotionInspectorSpring />
            <MotionInspectorDelay />
          </>
        )}
      </div>
    </MotionInspectorContext.Provider>
  );
});
