"use client";

import { type CSSProperties, type ComponentPropsWithoutRef, createContext, forwardRef, useContext, useEffect, useRef, useState } from "react";
import { usePointerAdjust } from "./number-field-scrub";
import { mergeRefs, useNumberField } from "./number-field-state";
import { cn } from "@/lib/utils";

/** How long step marks stay after a key press. */
const keyStepLinger = 700;

type SliderContextValue = {
  /** Where the value sits between min and max, from 0 to 1. */
  progress: number;
  /** True while dragging or stepping with keys; step marks show then. */
  adjusting: boolean;
};

const SliderContext = createContext<SliderContextValue | null>(null);

export function useNumberFieldSlider() {
  const context = useContext(SliderContext);
  if (!context) throw new Error("NumberFieldSlider parts must be rendered inside <NumberFieldSlider>.");
  return context;
}

/**
 * The slider presentation: a row that fills to the value. Drag anywhere to adjust it
 * relative to where you started, click or press Enter to type, and use the arrow keys,
 * Page Up/Down, Home and End to step. Needs `min` and `max` on the NumberField.
 * Exposes the position as `--number-field-progress` for custom parts.
 */
export const NumberFieldSlider = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function NumberFieldSlider(
  { className, style, onKeyDown, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, ...props },
  ref,
) {
  const field = useNumberField();
  const { min = 0, max = 100, display } = field;
  const range = max - min;
  const typing = field.draft !== null;
  const locked = field.disabled || field.readOnly;
  const progress = display === null || range === 0 ? 0 : Math.min(1, Math.max(0, (display - min) / range));
  const [keyStepping, setKeyStepping] = useState(false);
  const linger = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(linger.current), []);
  const adjusting = field.dragging || keyStepping;

  const adjust = usePointerAdjust({
    // Snap travel to whole steps so the value lands where the keyboard would.
    valueAt: (start, dx, width) => start + Math.round(((dx / width) * range) / field.step) * field.step,
    onTap: field.beginTyping,
  });

  const showSteps = () => {
    clearTimeout(linger.current);
    setKeyStepping(true);
    linger.current = setTimeout(() => setKeyStepping(false), keyStepLinger);
  };

  return (
    <SliderContext.Provider value={{ progress, adjusting }}>
      <div
        ref={mergeRefs(ref, field.sliderRef)}
        data-slot="slider"
        // While typing, the input inside takes over as the control.
        role={typing ? undefined : "slider"}
        tabIndex={typing || field.disabled ? -1 : 0}
        aria-label={typing ? undefined : field.label}
        aria-valuemin={typing ? undefined : min}
        aria-valuemax={typing ? undefined : max}
        aria-valuenow={typing ? undefined : display ?? undefined}
        aria-valuetext={typing ? undefined : field.valueText}
        aria-disabled={field.disabled || undefined}
        aria-readonly={field.readOnly || undefined}
        data-dragging={field.dragging || undefined}
        data-adjusting={adjusting || undefined}
        data-typing={typing || undefined}
        className={cn(
          "group/slider relative isolate flex h-[calc(var(--uicoolkit-field-height,2.5rem)-0.5rem)] w-full min-w-0 touch-pan-y items-center justify-between gap-3 overflow-hidden rounded-md bg-muted px-2.5 text-sm outline-none select-none focus-visible:ring-1 focus-visible:ring-ring aria-disabled:opacity-50 in-data-invalid:ring-1 in-data-invalid:ring-destructive",
          !locked && !typing && "cursor-ew-resize",
          className,
        )}
        style={{ "--number-field-progress": progress, ...style } as CSSProperties}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || typing || event.target !== event.currentTarget) return;
          const steps: Record<string, [number, boolean]> = {
            ArrowRight: [1, event.shiftKey],
            ArrowUp: [1, event.shiftKey],
            ArrowLeft: [-1, event.shiftKey],
            ArrowDown: [-1, event.shiftKey],
            PageUp: [1, true],
            PageDown: [-1, true],
          };
          if (event.key in steps) {
            event.preventDefault();
            if (!locked && display !== null) showSteps();
            field.stepBy(...steps[event.key]);
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            if (!locked) showSteps();
            field.commit(event.key === "Home" ? min : max);
          } else if (event.key === "Enter" || event.key === "F2") {
            event.preventDefault();
            field.beginTyping();
          }
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (!event.defaultPrevented && !typing) adjust.onPointerDown(event);
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          adjust.onPointerMove(event);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          adjust.onPointerUp(event);
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          adjust.onPointerCancel(event);
        }}
        {...props}
      />
    </SliderContext.Provider>
  );
});
