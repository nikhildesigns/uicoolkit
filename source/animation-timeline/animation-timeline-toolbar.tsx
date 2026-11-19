"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { InspectorField, InspectorFieldLabel, InspectorFieldSelect } from "@/components/ui/inspector-field";
import { PlaybackControls, PlaybackControlsRow, PlaybackLoopButton, PlaybackPlayButton, PlaybackRestartButton } from "@/components/ui/playback-controls";
import { useAnimationTimeline } from "./animation-timeline-state";
import { cn } from "@/lib/utils";

const quietButton = "size-9 rounded-md bg-foreground/8 text-foreground hover:bg-foreground/15 hover:text-foreground focus-visible:bg-foreground/15 focus-visible:text-foreground focus-visible:ring-0 pointer-coarse:size-11";

/** Fit, or a percent. Ctrl or Cmd + scroll can reach values between the choices. */
export const AnimationTimelineZoom = forwardRef<HTMLDivElement, Omit<ComponentPropsWithoutRef<"div">, "children">>(function AnimationTimelineZoom({ className, ...props }, ref) {
  const { zoom, zoomLevels, container, disabled, messages, setZoom } = useAnimationTimeline();
  const value = String(zoom);
  const options = [{ value: "fit", label: messages.fit, disabled: false }, ...zoomLevels.map((level) => ({ value: String(level), label: `${level}%`, disabled: false }))];
  if (!options.some((option) => option.value === value)) options.push({ value, label: `${zoom}%`, disabled: true });
  return (
    <InspectorField
      ref={ref}
      data-slot="animation-timeline-zoom"
      label={messages.zoom}
      align="start"
      disabled={disabled}
      className={cn("block w-24 shrink-0 [--uicoolkit-field-bg:color-mix(in_oklab,var(--foreground)_8%,transparent)] [--uicoolkit-field-border:transparent] [--uicoolkit-field-height:2.25rem] [--uicoolkit-field-shadow:none] pointer-coarse:[--uicoolkit-field-height:2.75rem]", className)}
      {...props}
    >
      <InspectorFieldLabel className="sr-only" />
      <InspectorFieldSelect value={value} options={options} container={container} positionMethod={container ? "fixed" : undefined} onCommit={(next) => setZoom(next === "fit" ? "fit" : Number(next))} />
    </InspectorField>
  );
});

/** The timeline's name, playback buttons and Zoom. */
export const AnimationTimelineToolbar = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function AnimationTimelineToolbar({ className, ...props }, ref) {
  const { label, playing, onPlayingChange, time, duration, loop, onLoopChange, formatTime, container, disabled, messages, commitSeek, seek } = useAnimationTimeline();
  return (
    <div ref={ref} data-slot="animation-timeline-toolbar" className={cn("flex min-w-0 items-center justify-end gap-1", className)} {...props}>
      <span aria-hidden className="mr-auto min-w-0 truncate font-medium text-foreground @max-md/timeline:hidden">
        {label}
      </span>
      <PlaybackControls label={messages.playback} playing={playing} onPlayingChange={onPlayingChange} currentTime={time} duration={duration} onSeek={seek} onSeekCommit={commitSeek} loop={loop} onLoopChange={onLoopChange} formatTime={formatTime} container={container} disabled={disabled} className="w-auto shrink-0 [container-type:normal]!">
        <PlaybackControlsRow className="flex-nowrap">
          <PlaybackPlayButton className={quietButton} />
          <PlaybackRestartButton className={quietButton} />
          <PlaybackLoopButton className={cn(quietButton, "aria-pressed:bg-foreground/20")} />
        </PlaybackControlsRow>
      </PlaybackControls>
      <AnimationTimelineZoom />
    </div>
  );
});
