"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";
import { InspectorField, InspectorFieldLabel, InspectorFieldSegments } from "@/components/ui/inspector-field";
import { NumberField, NumberFieldError, NumberFieldLabel, NumberFieldSlider, NumberFieldSliderFill, NumberFieldSliderThumb, NumberFieldValue } from "@/components/ui/number-field";
import type { MotionRange } from "./motion-inspector-math";
import { type MotionInspectorDetail, type MotionPatch, useMotionInspector } from "./motion-inspector-state";
import { cn } from "@/lib/utils";

type DivProps = Omit<ComponentPropsWithoutRef<"div">, "children">;

/** A labelled two-choice switch that fills the panel's width. */
export function MotionSwitch<V extends string>({ label, value, options, onCommit, className, ...props }: DivProps & { label: string; value: V; options: { value: V; label: string }[]; onCommit: (value: V) => void }) {
  const { mixed, disabled, readOnly } = useMotionInspector();
  return (
    <InspectorField label={label} mixed={mixed} disabled={disabled} readOnly={readOnly} className={cn("block min-w-0", className)} {...props}>
      <InspectorFieldLabel className="sr-only" />
      <InspectorFieldSegments className="h-[var(--uicoolkit-field-height,2.5rem)] w-full" value={value} options={options} onCommit={onCommit} />
    </InspectorField>
  );
}

/** A compact choice in a labelled row, styled like Inspector Field's Off/On toggle. */
export function MotionChoiceRow<V extends string>({ label, value, options, onCommit, className, ...props }: DivProps & { label: string; value: V; options: { value: V; label: string }[]; onCommit: (value: V) => void }) {
  const { mixed, disabled, readOnly } = useMotionInspector();
  return (
    <InspectorField
      label={label}
      labelPosition="inside"
      mixed={mixed}
      disabled={disabled}
      readOnly={readOnly}
      // The same filled box as the sliders around it.
      className={cn("min-w-0 [--uicoolkit-field-bg:var(--muted)] [--uicoolkit-field-border:transparent] [--uicoolkit-field-shadow:none]", className)}
      {...props}
    >
      <InspectorFieldLabel />
      <div className="flex h-[var(--uicoolkit-field-height,2.5rem)] min-w-0 items-center justify-end gap-2 pr-1 pl-2">
        <InspectorFieldSegments className="w-36" highlightClassName="bg-foreground/10 shadow-none ring-0" value={value} options={options} onCommit={onCommit} />
      </div>
    </InspectorField>
  );
}

type SliderProps = DivProps & { field: Exclude<MotionInspectorDetail["field"], "type" | "definedBy" | "curve">; label: string; value: number; range: MotionRange };

/** A number slider for one property of the current value. */
export function MotionSlider({ field, label, value, range, className, ...props }: SliderProps) {
  const { mixed, disabled, readOnly, messages, preview, commit } = useMotionInspector();
  const patch = (next: number): MotionPatch => ({ [field]: next });
  return (
    <NumberField
      data-slot={`motion-inspector-${field}`}
      className={cn("min-w-0", className)}
      label={label}
      value={mixed ? null : value}
      placeholder={messages.mixed}
      min={range.min}
      max={range.max}
      step={range.step}
      unit={range.unit}
      disabled={disabled}
      readOnly={readOnly}
      onValueChange={(next) => preview(patch(next), field)}
      onValueCommit={(next) => commit(patch(next), field)}
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
}

/** Asks your app to play the transition. It shows when you pass onReplay and something is selected. */
export const MotionInspectorReplay = forwardRef<HTMLButtonElement, Omit<ComponentPropsWithoutRef<"button">, "children">>(function MotionInspectorReplay({ className, onClick, ...props }, ref) {
  const { value, disabled, container, messages, onReplay } = useMotionInspector();
  if (!value || !onReplay) return null;
  return (
    <Tooltip.Provider delay={400}>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <button
              ref={ref}
              type="button"
              aria-label={messages.replay}
              disabled={disabled}
              data-slot="motion-inspector-replay"
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors select-none hover:bg-foreground/10 hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none pointer-coarse:size-11 [&_svg]:size-4",
                className,
              )}
              onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) onReplay();
              }}
              {...props}
            >
              <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8a5 5 0 1 0 1.5-3.6L3 5.8M3 2.8v3h3" />
              </svg>
            </button>
          }
        />
        <Tooltip.Portal container={container ?? undefined}>
          <Tooltip.Positioner side="top" sideOffset={6} className="z-50">
            <Tooltip.Popup className="rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md pointer-coarse:hidden">{messages.replay}</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
});

/** The panel's name and Replay. Pass children to replace the name. */
export const MotionInspectorHeader = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function MotionInspectorHeader({ className, children, ...props }, ref) {
  const { label } = useMotionInspector();
  return (
    <div ref={ref} data-slot="motion-inspector-header" className={cn("flex min-h-8 items-center justify-between gap-2", className)} {...props}>
      <span aria-hidden className="min-w-0 truncate font-medium text-foreground">
        {children ?? label}
      </span>
      <MotionInspectorReplay />
    </div>
  );
});

/** Switches between Easing and Spring. */
export function MotionInspectorMode(props: DivProps) {
  const { value, messages, chooseType } = useMotionInspector();
  if (!value) return null;
  return (
    <MotionSwitch
      data-slot="motion-inspector-mode"
      label={messages.type}
      value={value.type}
      options={[
        { value: "easing", label: messages.easing },
        { value: "spring", label: messages.spring },
      ]}
      onCommit={chooseType}
      {...props}
    />
  );
}

/** How long to wait before starting. It shows when the value includes a delay. */
export function MotionInspectorDelay(props: DivProps) {
  const { value, ranges, messages } = useMotionInspector();
  if (value?.delay === undefined) return null;
  return <MotionSlider field="delay" label={messages.delay} value={value.delay} range={ranges.delay} {...props} />;
}

type EmptyProps = ComponentPropsWithoutRef<"div"> & { icon?: ReactNode };

/** Shown when nothing is selected: an icon with the text centred below it, like every empty state in the kit. */
export const MotionInspectorEmpty = forwardRef<HTMLDivElement, EmptyProps>(function MotionInspectorEmpty({ icon, className, children, ...props }, ref) {
  const { value, messages } = useMotionInspector();
  if (value) return null;
  return (
    <div ref={ref} data-slot="motion-inspector-empty" className={cn("flex flex-col items-center justify-center gap-2.5 px-4 py-10 text-center text-sm text-muted-foreground", className)} {...props}>
      <span aria-hidden className="grid size-10 place-items-center rounded-full bg-muted [&_svg]:size-5">
        {icon ?? (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path d="M3 16C9 16 8 4 17 4" />
          </svg>
        )}
      </span>
      <p className="max-w-52 text-balance">{children ?? messages.empty}</p>
    </div>
  );
});
