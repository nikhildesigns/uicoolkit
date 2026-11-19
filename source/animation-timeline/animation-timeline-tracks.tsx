"use client";

import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";
import { ContextMenu, ContextMenuButton, ContextMenuContent, ContextMenuItem, ContextMenuTarget } from "@/components/ui/context-menu";
import { AnimationTimelineItem } from "./animation-timeline-items";
import { type TimelineTrack, formatRulerTime, rulerMarks } from "./animation-timeline-math";
import { useAnimationTimeline } from "./animation-timeline-state";
import { cn } from "@/lib/utils";

const line = (path: string) => (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);
const icons = {
  shown: line("M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8ZM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"),
  hidden: line("M2 2l12 12M6.5 3.7A6 6 0 0 1 8 3.5c4 0 6.5 4.5 6.5 4.5a11 11 0 0 1-1.9 2.4M4.2 4.9A11 11 0 0 0 1.5 8S4 12.5 8 12.5a6 6 0 0 0 2.7-.7"),
  locked: line("M4 7.5h8v6H4ZM5.5 7.5V5a2.5 2.5 0 0 1 5 0v2.5"),
  unlocked: line("M4 7.5h8v6H4ZM5.5 7.5V5a2.5 2.5 0 0 1 4.8-1"),
};

function TrackButton({ label, icon, pressed, onClick }: { label: string; icon: ReactNode; pressed: boolean; onClick: () => void }) {
  const { disabled } = useAnimationTimeline();
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={disabled}
      // Quiet until the row is hovered or the button is on, so the column stays clean.
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 outline-none transition-[color,background-color,opacity] group-hover/track:opacity-100 hover:bg-foreground/10 hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground focus-visible:opacity-100 disabled:pointer-events-none aria-pressed:text-foreground aria-pressed:opacity-100 motion-reduce:transition-none [&_svg]:size-3.5"
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function TrackHeader({ track }: { track: TimelineTrack }) {
  const { onTrackHiddenChange, onTrackLockedChange, container, disabled, messages } = useAnimationTimeline();
  const hideName = `${track.hidden ? messages.show : messages.hide} ${track.label}`;
  const lockName = `${track.locked ? messages.unlock : messages.lock} ${track.label}`;
  const hasActions = onTrackHiddenChange || onTrackLockedChange;
  return (
    <ContextMenu disabled={disabled || !hasActions}>
      <ContextMenuTarget data-slot="animation-timeline-track" data-hidden={track.hidden ? "" : undefined} data-locked={track.locked ? "" : undefined} className="group/track flex h-(--timeline-row) min-w-0 items-center gap-0.5 pr-1">
        <span className={cn("min-w-0 flex-1 truncate text-foreground/80", track.hidden && "line-through opacity-60")}>{track.label}</span>
        <span className="flex shrink-0 items-center @max-md/timeline:hidden">
          {onTrackHiddenChange && <TrackButton label={hideName} icon={track.hidden ? icons.hidden : icons.shown} pressed={!!track.hidden} onClick={() => onTrackHiddenChange(track.id, !track.hidden)} />}
          {onTrackLockedChange && <TrackButton label={lockName} icon={track.locked ? icons.locked : icons.unlocked} pressed={!!track.locked} onClick={() => onTrackLockedChange(track.id, !track.locked)} />}
        </span>
        {hasActions && <ContextMenuButton aria-label={messages.trackOptions(track.label)} className="hidden size-7 pointer-coarse:size-11 @max-md/timeline:inline-flex" />}
      </ContextMenuTarget>
      <ContextMenuContent container={container} positionMethod={container ? "fixed" : undefined}>
        {onTrackHiddenChange && <ContextMenuItem onClick={() => onTrackHiddenChange(track.id, !track.hidden)}>{track.hidden ? messages.show : messages.hide}</ContextMenuItem>}
        {onTrackLockedChange && <ContextMenuItem onClick={() => onTrackLockedChange(track.id, !track.locked)}>{track.locked ? messages.unlock : messages.lock}</ContextMenuItem>}
      </ContextMenuContent>
    </ContextMenu>
  );
}

const badgeHalf = "1.5rem";

/** The time scale. Click or drag it to move the playhead. */
export function AnimationTimelineRuler({ className }: { className?: string }) {
  const { time, duration, pixelsPerSecond, major, minor, disabled, scrubbing, messages, formatTime, rulerHandlers } = useAnimationTimeline();
  const width = duration * pixelsPerSecond;
  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={messages.playhead}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={time}
      aria-valuetext={formatTime(time)}
      aria-disabled={disabled || undefined}
      data-slot="animation-timeline-ruler"
      data-scrubbing={scrubbing ? "" : undefined}
      className={cn("group/ruler relative h-full shrink-0 cursor-ew-resize touch-none overflow-hidden outline-none select-none aria-disabled:cursor-default", className)}
      style={{ width, backgroundImage: "linear-gradient(to right, color-mix(in oklab, var(--foreground) 30%, transparent) 1px, transparent 1px)", backgroundSize: `${minor * pixelsPerSecond}px 0.375rem`, backgroundPosition: "0 55%", backgroundRepeat: "repeat-x" }}
      {...rulerHandlers}
    >
      {rulerMarks(duration, major).filter((mark) => width - mark * pixelsPerSecond >= 28).map((mark) => (
        <span key={mark} aria-hidden className="absolute inset-y-1.5 border-l border-foreground/45 bg-background pl-1 font-mono text-[0.625rem] leading-none whitespace-nowrap text-foreground/75 tabular-nums" style={{ left: mark * pixelsPerSecond }}>
          {formatRulerTime(mark, major)}
        </span>
      ))}
      {/* Joins the time label to the line running through the tracks. */}
      <span aria-hidden data-slot="animation-timeline-playhead-stem" className="absolute top-4 bottom-0 w-0.5 bg-primary" style={{ left: `clamp(0px, ${time * pixelsPerSecond}px, calc(100% - 2px))` }} />
      <span
        aria-hidden
        data-slot="animation-timeline-playhead-head"
        className="absolute top-1 z-10 w-12 -translate-x-1/2 rounded-[5px] bg-primary py-0.5 text-center font-mono text-[0.6875rem] leading-4 text-primary-foreground tabular-nums group-focus-visible/ruler:ring-2 group-focus-visible/ruler:ring-ring"
        style={{ left: `clamp(${badgeHalf}, ${time * pixelsPerSecond}px, calc(100% - ${badgeHalf}))` }}
      >
        {Number(time.toFixed(2)).toFixed(2)}
      </span>
    </div>
  );
}

/** The ruler, track names, rows, items and playhead. It scrolls when zoomed in, while names and the ruler stay in place. */
export const AnimationTimelineBody = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function AnimationTimelineBody({ className, ...props }, ref) {
  const { tracks, items, duration, time, pixelsPerSecond, guide, messages, instructionsId, scrollerRef, namesRef, laneRef, onLaneClick } = useAnimationTimeline();
  const width = duration * pixelsPerSecond;
  if (!tracks.length) {
    return (
      <div ref={ref} data-slot="animation-timeline-empty" className={cn("flex flex-col items-center justify-center gap-2.5 px-4 py-10 text-center text-sm text-muted-foreground", className)} {...props}>
        <span aria-hidden className="grid size-10 place-items-center rounded-full bg-muted [&_svg]:size-5">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path d="M3 6h8M7 10h10M3 14h6" />
          </svg>
        </span>
        <p className="max-w-52 text-balance">{messages.empty}</p>
      </div>
    );
  }
  return (
    <div
      ref={(node) => {
        scrollerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-slot="animation-timeline-scroller"
      className={cn("relative max-h-80 overflow-auto overscroll-x-contain [--timeline-names:9rem] [--timeline-row:2.25rem] pointer-coarse:[--timeline-row:2.75rem] @max-md/timeline:[--timeline-names:6.5rem]", className)}
      {...props}
    >
      <span id={instructionsId} className="sr-only">
        {messages.instructions}
      </span>
      <div className="min-w-full" style={{ width: `calc(var(--timeline-names) + ${width}px)` }}>
        <div className="sticky top-0 z-30 flex h-8 bg-background">
          <div aria-hidden className="sticky left-0 z-20 w-(--timeline-names) shrink-0 bg-background" />
          <AnimationTimelineRuler />
        </div>
        <div className="flex">
          <div ref={namesRef} className="sticky left-0 z-20 w-(--timeline-names) shrink-0 bg-background">
            {tracks.map((track) => (
              <TrackHeader key={track.id} track={track} />
            ))}
          </div>
          <div
            ref={laneRef}
            data-slot="animation-timeline-lanes"
            className="relative shrink-0 overflow-hidden select-none"
            style={{ width }}
            onClick={(event) => {
              if (event.currentTarget.contains(event.target as Node)) onLaneClick(event.target as Element, event.shiftKey);
            }}
          >
            {tracks.map((track) => (
              <div key={track.id} className="h-(--timeline-row) py-0.5">
                <div data-locked={track.locked ? "" : undefined} className="h-full rounded-md bg-foreground/8 data-locked:opacity-50" />
              </div>
            ))}
            {items.map((item) => (
              <AnimationTimelineItem key={item.id} item={item} />
            ))}
            {guide !== null && <div aria-hidden data-slot="animation-timeline-guide" className="pointer-events-none absolute inset-y-0 z-10 w-px bg-primary" style={{ left: guide * pixelsPerSecond }} />}
            <div aria-hidden data-slot="animation-timeline-playhead" className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-primary" style={{ left: `clamp(0px, ${time * pixelsPerSecond}px, calc(100% - 2px))` }} />
          </div>
        </div>
      </div>
    </div>
  );
});
