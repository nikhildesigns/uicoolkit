"use client";

import { type ComponentPropsWithoutRef, forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNumberFieldSlider } from "./number-field-slider";
import { mergeRefs, useNumberField } from "./number-field-state";
import { cn } from "@/lib/utils";

/*
 * Shared geometry: the thumb's centre travels from 8px to (100% - 8px), and the fill ends
 * 6px past it so the thumb sits inside the fill's rounded end. Step marks use the same track.
 */
const thumbAt = "calc(8px + (100% - 16px) * var(--number-field-progress))";
const fillTo = "calc(14px + (100% - 16px) * var(--number-field-progress))";
/** More marks than this would read as texture, so large steps or none are shown instead. */
const maxMarks = 40;
/** Room kept between the thumb and the label or value text, in pixels. */
const textClearance = 6;

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Steps glide; a drag follows the pointer exactly. */
function useGlide(property: string) {
  const { animated, dragging } = useNumberField();
  return animated && !dragging && `${property} duration-150 ease-out motion-reduce:transition-none`;
}

/** The filled part of the slider row, rounded at its end, sized to the value. */
export const NumberFieldSliderFill = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function NumberFieldSliderFill(
  { className, style, ...props },
  ref,
) {
  const { display } = useNumberField();
  const glide = useGlide("transition-[width]");
  return (
    <span
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-y-0 left-0 -z-10 rounded-[inherit] bg-foreground/10", glide, className)}
      style={{ width: display === null ? 0 : fillTo, ...style }}
      {...props}
    />
  );
});

/**
 * A small handle inside the end of the fill. It grows slightly while dragging, and fades out
 * where it would run under the label or value (parts marked data-slot="label" or "value").
 * Hidden when read-only.
 */
export const NumberFieldSliderThumb = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function NumberFieldSliderThumb(
  { className, style, ...props },
  ref,
) {
  const { display, dragging, animated, readOnly } = useNumberField();
  const { progress } = useNumberFieldSlider();
  const [covered, setCovered] = useState(false);
  const own = useRef<HTMLSpanElement | null>(null);
  const glide = useGlide("transition-[left,scale,opacity]");

  // Measured after every render: the value text changes width as the number changes.
  useIsomorphicLayoutEffect(() => {
    // The thumb's own node is attached by now; the slider's merged ref may not be yet.
    const slider = own.current?.closest<HTMLElement>('[data-slot="slider"]');
    if (!slider) return;
    const box = slider.getBoundingClientRect();
    const x = box.left + 8 + (box.width - 16) * progress;
    const text = slider.querySelectorAll<HTMLElement>('[data-slot="label"], [data-slot="value"]');
    setCovered(
      Array.from(text).some((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && x > rect.left - textClearance && x < rect.right + textClearance;
      }),
    );
  });

  // A read-only value has nothing to grab, so the fill alone shows it.
  if (display === null || readOnly) return null;
  return (
    <span
      ref={mergeRefs(ref, own)}
      aria-hidden
      data-dragging={dragging || undefined}
      data-covered={covered || undefined}
      className={cn(
        "pointer-events-none absolute top-1/2 -z-10 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/45 data-covered:opacity-0 data-dragging:scale-y-110 data-dragging:bg-foreground/70",
        glide,
        animated && dragging && "transition-[scale,opacity] duration-150 motion-reduce:transition-none",
        className,
      )}
      style={{ left: thumbAt, ...style }}
      {...props}
    />
  );
});

type StepsProps = ComponentPropsWithoutRef<"span"> & {
  /** Class for each mark. Marks under the fill have data-filled. */
  markClassName?: string;
};

/** Step marks along the bottom of the track that fade in while dragging or stepping with keys. */
export const NumberFieldSliderSteps = forwardRef<HTMLSpanElement, StepsProps>(function NumberFieldSliderSteps(
  { className, markClassName, ...props },
  ref,
) {
  const { min = 0, max = 100, step, largeStep, animated } = useNumberField();
  const { progress, adjusting } = useNumberFieldSlider();
  const range = max - min;
  const interval = range / step <= maxMarks ? step : largeStep;
  const count = range > 0 ? Math.round(range / interval) : 0;
  if (count < 1 || count > maxMarks) return null;
  const marks = Array.from({ length: count + 1 }, (_, index) => Math.min(1, (index * interval) / range));
  return (
    <span
      ref={ref}
      aria-hidden
      data-visible={adjusting || undefined}
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 opacity-0 data-visible:opacity-100",
        animated && "transition-opacity duration-200 motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      {marks.map((at) => (
        <span
          key={at}
          data-filled={at <= progress || undefined}
          // Along the bottom edge, like a ruler, so the marks stay clear of the label and value.
          className={cn("absolute bottom-[3px] h-1.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground/20 data-filled:bg-foreground/35", markClassName)}
          style={{ left: `calc(8px + (100% - 16px) * ${at})` }}
        />
      ))}
    </span>
  );
});
