"use client";

import { type ComponentPropsWithoutRef, type KeyboardEvent, forwardRef } from "react";
import { type PlaybackVolumeState, usePlaybackControls } from "./playback-controls-state";
import { cn } from "@/lib/utils";

type DivProps = Omit<ComponentPropsWithoutRef<"div">, "children">;
type SliderProps = DivProps & {
  slot: string;
  name: string;
  orientation?: "horizontal" | "vertical";
  /** Position along the track, from 0 to 1. */
  ratio: number;
  max: number;
  now: number;
  text: string;
  enabled: boolean;
  blocked: boolean;
  active: boolean;
  pointerFocus: boolean;
  trackRef: { current: HTMLDivElement | null };
  thumbRef: { current: HTMLDivElement | null };
  handlers: PlaybackVolumeState["handlers"];
  onThumbKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onThumbBlur: () => void;
};

const both = <Event,>(own: ((event: Event) => void) | undefined, next: (event: Event) => void) => (event: Event) => {
  own?.(event);
  next(event);
};

/** The track and thumb shared by the seek bar and the volume slider. */
export const PlaybackSlider = forwardRef<HTMLDivElement, SliderProps>(function PlaybackSlider(
  { slot, name, orientation = "horizontal", ratio, max, now, text, enabled, blocked, active, pointerFocus, trackRef, thumbRef, handlers, onThumbKeyDown, onThumbBlur, className, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture, ...props },
  ref,
) {
  const position = `${ratio * 100}%`;
  const vertical = orientation === "vertical";
  return (
    <div
      ref={ref}
      data-slot={slot}
      data-scrubbing={active ? "" : undefined}
      className={cn(
        "flex select-none",
        vertical ? "h-28 w-6 touch-pan-x flex-col items-center" : "h-6 min-w-0 touch-pan-y items-center pointer-coarse:h-11",
        enabled ? "cursor-pointer" : "opacity-50",
        blocked && "cursor-not-allowed",
        className,
      )}
      onPointerDown={both(onPointerDown, handlers.onPointerDown)}
      onPointerMove={both(onPointerMove, handlers.onPointerMove)}
      onPointerUp={both(onPointerUp, handlers.onPointerUp)}
      onPointerCancel={both(onPointerCancel, handlers.onPointerCancel)}
      onLostPointerCapture={both(onLostPointerCapture, handlers.onLostPointerCapture)}
      {...props}
    >
      <div ref={trackRef} data-slot={`${slot}-track`} data-orientation={orientation} className={cn("relative flex-1 rounded-full bg-foreground/15", vertical ? "my-1.5 w-1" : "mx-1.5 h-1")}>
        <div data-slot={`${slot}-fill`} className={cn("absolute rounded-full bg-primary", vertical ? "inset-x-0 bottom-0" : "inset-y-0 left-0")} style={vertical ? { height: position } : { width: position }} />
        <div
          ref={thumbRef}
          role="slider"
          tabIndex={enabled ? 0 : undefined}
          aria-label={name}
          aria-orientation={orientation}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={now}
          aria-valuetext={text}
          aria-disabled={!enabled || undefined}
          data-slot={`${slot}-thumb`}
          data-active={active ? "" : undefined}
          data-pointer-focus={pointerFocus ? "" : undefined}
          className={cn(
            "absolute size-3 -translate-x-1/2 rounded-full bg-primary shadow-sm outline-none transition-[scale,box-shadow] duration-100 ease-out data-active:scale-125 data-active:ring-4 data-active:ring-primary/25 motion-reduce:transition-none [&:focus-visible:not([data-pointer-focus])]:ring-2 [&:focus-visible:not([data-pointer-focus])]:ring-primary/40",
            vertical ? "left-1/2 translate-y-1/2" : "top-1/2 -translate-y-1/2",
          )}
          style={vertical ? { bottom: position } : { left: position }}
          onKeyDown={onThumbKeyDown}
          onBlur={onThumbBlur}
        />
      </div>
    </div>
  );
});

/** The bar you press to jump and drag to scrub. Its thumb holds keyboard focus. */
export const PlaybackSeek = forwardRef<HTMLDivElement, DivProps>(function PlaybackSeek({ className, ...props }, ref) {
  const { time, duration, seekable, disabled, scrubbing, pointerFocus, messages, formatTime, trackRef, thumbRef, seekHandlers, onSeekKeyDown, onThumbBlur } = usePlaybackControls();
  const total = duration === null ? messages.unknownTime : formatTime(duration);
  return (
    <PlaybackSlider
      ref={ref}
      slot="playback-seek"
      name={messages.seek}
      ratio={duration ? time / duration : 0}
      max={duration ?? 0}
      now={Math.round(time * 100) / 100}
      text={messages.seekValue(formatTime(time), total)}
      enabled={seekable}
      blocked={disabled}
      active={scrubbing}
      pointerFocus={pointerFocus}
      trackRef={trackRef}
      thumbRef={thumbRef}
      handlers={seekHandlers}
      onThumbKeyDown={onSeekKeyDown}
      onThumbBlur={onThumbBlur}
      className={cn("flex-1", className)}
      {...props}
    />
  );
});

type TimeProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** Which time to show. Place current and duration on either side of the seek bar. */
  show?: "both" | "current" | "duration";
};

/** The current position, the total length, or both. */
export const PlaybackTime = forwardRef<HTMLSpanElement, TimeProps>(function PlaybackTime({ show = "both", className, ...props }, ref) {
  const { time, duration, messages, formatTime } = usePlaybackControls();
  const current = formatTime(time);
  const total = duration === null ? messages.unknownTime : formatTime(duration);
  return (
    <span ref={ref} data-slot="playback-time" className={cn("shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums", className)} {...props}>
      {show === "current" ? current : show === "duration" ? total : `${current} / ${total}`}
    </span>
  );
});
