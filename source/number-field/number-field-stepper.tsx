"use client";

import { type ComponentPropsWithoutRef, forwardRef, useEffect, useRef } from "react";
import { useNumberField } from "./number-field-state";
import { cn } from "@/lib/utils";

/** How long an arrow is held before it repeats, and how often it repeats after that. */
const holdDelay = 400;
const repeatEvery = 60;

/*
 * Split styles are written twice: for stepperLayout="split", and for "auto" on a coarse pointer.
 * Each part carries data-layout so the CSS decides, with no flash before hydration.
 */

/**
 * Up and down arrows in a small pill centred at the end of NumberFieldGroup, with room above and below. In the split layout
 * the pill dissolves and the buttons move to either side of the value as larger − and + targets.
 */
export const NumberFieldStepper = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function NumberFieldStepper(
  { className, ...props },
  ref,
) {
  const { stepperLayout, readOnly } = useNumberField();
  // A read-only value cannot be stepped, so the arrows are left out rather than shown disabled.
  if (readOnly) return null;
  return (
    <div
      ref={ref}
      data-layout={stepperLayout}
      className={cn(
        // A thin border keeps the stepper distinct from the field in light themes, where muted and background are close.
        "mr-1.5 flex h-7 w-5 shrink-0 flex-col self-center divide-y divide-border overflow-hidden rounded-[5px] bg-muted ring-1 ring-border data-[layout=split]:contents pointer-coarse:data-[layout=auto]:contents",
        className,
      )}
      {...props}
    />
  );
});

type StepProps = ComponentPropsWithoutRef<"button">;

function stepButton(direction: 1 | -1, name: string, icon: string, touchIcon: string) {
  const Step = forwardRef<HTMLButtonElement, StepProps>(function Step({ className, children, onClick, onMouseDown, onPointerDown, ...props }, ref) {
    const field = useNumberField();
    // Timers outlive the render that started them, so they act on the latest field.
    const latest = useRef(field);
    latest.current = field;
    const pressed = useRef(false);
    const stopHold = useRef<() => void>(undefined);
    useEffect(() => () => stopHold.current?.(), []);

    const bound = direction > 0 ? field.max : field.min;
    const atBound = bound !== undefined && field.display !== null && (direction > 0 ? field.display >= bound : field.display <= bound);

    /** One step now; holding repeats as a live preview that commits once on release. */
    const startHold = (large: boolean) => {
      latest.current.stepBy(direction, large);
      let current: number | null = null;
      let timer: ReturnType<typeof setTimeout>;
      const tick = () => {
        if (current === null) {
          current = latest.current.beginDrag();
          if (current === null) return;
        }
        current += direction * (large ? latest.current.largeStep : latest.current.step);
        latest.current.dragTo(current);
        timer = setTimeout(tick, repeatEvery);
      };
      timer = setTimeout(tick, holdDelay);
      // Listen on the window: the button disables itself at a limit and then gets no pointer events.
      const stop = () => {
        clearTimeout(timer);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
        window.removeEventListener("blur", stop);
        stopHold.current = undefined;
        if (current !== null) latest.current.endDrag();
      };
      window.addEventListener("pointerup", stop);
      window.addEventListener("pointercancel", stop);
      window.addEventListener("blur", stop);
      stopHold.current = stop;
    };

    return (
      <button
        ref={ref}
        type="button"
        // Keyboard users step with the arrow keys in the input, so the buttons stay out of the tab order.
        tabIndex={-1}
        data-layout={field.stepperLayout}
        aria-label={direction > 0 ? field.messages.increment : field.messages.decrement}
        aria-controls={field.inputId}
        disabled={field.disabled || field.readOnly || field.adjustFrom === null || atBound}
        className={cn(
          // Quiet until the field is hovered or focused; the pressed arrow nudges the way it steps.
          "group/step flex min-h-0 flex-1 touch-none items-center justify-center text-muted-foreground outline-none hover:bg-accent hover:text-foreground! focus-visible:bg-accent focus-visible:text-foreground! active:bg-accent/70 disabled:pointer-events-none disabled:opacity-35",
          direction > 0 ? "active:[&>svg]:-translate-y-px" : "active:[&>svg]:translate-y-px",
          // Split: a full-height button on each side, decrease first and increase last.
          "data-[layout=split]:w-10 data-[layout=split]:flex-none data-[layout=split]:text-muted-foreground data-[layout=split]:active:[&>svg]:translate-y-0 data-[layout=split]:active:[&>svg]:scale-90",
          "pointer-coarse:data-[layout=auto]:w-10 pointer-coarse:data-[layout=auto]:flex-none pointer-coarse:data-[layout=auto]:text-muted-foreground pointer-coarse:data-[layout=auto]:active:[&>svg]:translate-y-0 pointer-coarse:data-[layout=auto]:active:[&>svg]:scale-90",
          direction > 0
            ? "data-[layout=split]:order-last data-[layout=split]:border-l data-[layout=split]:border-input pointer-coarse:data-[layout=auto]:order-last pointer-coarse:data-[layout=auto]:border-l pointer-coarse:data-[layout=auto]:border-input"
            : "data-[layout=split]:order-first data-[layout=split]:border-r data-[layout=split]:border-input pointer-coarse:data-[layout=auto]:order-first pointer-coarse:data-[layout=auto]:border-r pointer-coarse:data-[layout=auto]:border-input",
          field.animated && "[&>svg]:transition-transform [&>svg]:duration-100 motion-reduce:[&>svg]:transition-none",
          className,
        )}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || event.button !== 0) return;
          pressed.current = true;
          stopHold.current?.();
          startHold(event.shiftKey);
        }}
        onMouseDown={(event) => {
          onMouseDown?.(event);
          // Keep focus (and any typed draft) in the input while stepping.
          event.preventDefault();
        }}
        onClick={(event) => {
          onClick?.(event);
          // A pointer press already stepped; a click from assistive technology steps here.
          if (pressed.current) pressed.current = false;
          else if (!event.defaultPrevented) field.stepBy(direction, event.shiftKey);
        }}
        {...props}
      >
        {children ?? (
          <>
            <svg aria-hidden viewBox="0 0 10 6" className="h-1.5 w-2.5 group-data-[layout=split]/step:hidden pointer-coarse:group-data-[layout=auto]/step:hidden" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
            <svg aria-hidden viewBox="0 0 16 16" className="hidden size-4 group-data-[layout=split]/step:block pointer-coarse:group-data-[layout=auto]/step:block" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <path d={touchIcon} />
            </svg>
          </>
        )}
      </button>
    );
  });
  Step.displayName = name;
  return Step;
}

export const NumberFieldIncrement = stepButton(1, "NumberFieldIncrement", "M1.5 4.75 5 1.25l3.5 3.5", "M3.5 8h9M8 3.5v9");
export const NumberFieldDecrement = stepButton(-1, "NumberFieldDecrement", "M1.5 1.25 5 4.75l3.5-3.5", "M3.5 8h9");
