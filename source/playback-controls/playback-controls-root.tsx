"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type KeyboardEvent, forwardRef, useRef, useState } from "react";
import { usePlaybackScrub } from "./playback-controls-scrub";
import { PlaybackSeek, PlaybackTime } from "./playback-controls-seek";
import { PlaybackTransport } from "./playback-controls-settings";
import { type PlaybackControlsProps, type PlaybackSeekDetail, PlaybackControlsContext, defaultMessages, defaultSpeeds } from "./playback-controls-state";
import { clampTime, formatPlaybackTime } from "./playback-controls-time";
import { cn } from "@/lib/utils";

/** Lays parts out in a line. Use one per row when composing your own controls. */
export const PlaybackControlsRow = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function PlaybackControlsRow({ className, ...props }, ref) {
  return <div ref={ref} data-slot="playback-controls-row" className={cn("flex flex-wrap items-center gap-1", className)} {...props} />;
});

/** Transport controls for playback your app runs. Without children it shows every part your props support. */
export const PlaybackControls = forwardRef<HTMLDivElement, PlaybackControlsProps>(function PlaybackControls(
  {
    label,
    playing,
    onPlayingChange,
    currentTime,
    duration,
    onSeekCommit,
    onSeek,
    onScrubbingChange,
    step = 0.1,
    largeStep = 1,
    volume,
    onVolumeChange,
    onVolumeCommit,
    muted = false,
    onMutedChange,
    loop,
    onLoopChange,
    speed,
    onSpeedChange,
    speeds = defaultSpeeds,
    formatTime = formatPlaybackTime,
    loading = false,
    disabled = false,
    container,
    messages: messageOverrides,
    className,
    children,
    ...props
  },
  ref,
) {
  const messages = { ...defaultMessages, ...messageOverrides };
  const [live, setLive] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const length = duration !== null && duration > 0 ? duration : 0;
  const seekable = !disabled && !loading && length > 0;
  const current = clampTime(currentTime, length);
  const time = live ?? current;
  const ended = length > 0 && !loop && time >= length;
  const { scrubbing, pointerFocus, setPointerFocus, seekHandlers, isScrubbing } = usePlaybackScrub({ time: current, duration: length, enabled: seekable, trackRef, thumbRef, setLive, onSeek, onSeekCommit, onScrubbingChange });

  const [liveVolume, setLiveVolume] = useState<number | null>(null);
  const volumeTrackRef = useRef<HTMLDivElement>(null);
  const volumeThumbRef = useRef<HTMLDivElement>(null);
  const savedVolume = clampTime(volume ?? 0, 1);
  const level = liveVolume ?? (muted ? 0 : savedVolume);
  const commitVolume = (next: number) => {
    onVolumeCommit?.(next);
    if (muted && next > 0) onMutedChange?.(false);
  };
  // The volume slider drags exactly like the seek bar, over a length of 1.
  const volumeDrag = usePlaybackScrub({
    time: savedVolume,
    duration: 1,
    enabled: !disabled && volume !== undefined,
    trackRef: volumeTrackRef,
    thumbRef: volumeThumbRef,
    setLive: setLiveVolume,
    onSeek: (next) => onVolumeChange?.(next),
    onSeekCommit: commitVolume,
  });

  const onVolumeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const amount = event.shiftKey ? 0.2 : 0.05;
    const targets: Record<string, number> = { ArrowLeft: level - amount, ArrowDown: level - amount, ArrowRight: level + amount, ArrowUp: level + amount, PageDown: level - 0.2, PageUp: level + 0.2, Home: 0, End: 1 };
    const raw = targets[event.key];
    if (raw === undefined || disabled) return;
    event.preventDefault();
    volumeDrag.setPointerFocus(false);
    const target = clampTime(raw, 1);
    if (target === level || volumeDrag.isScrubbing()) return;
    onVolumeChange?.(target);
    commitVolume(target);
  };

  const seekTo = (next: number, source: PlaybackSeekDetail["source"]) => {
    const target = clampTime(next, length);
    if (!seekable || isScrubbing() || target === current) return;
    onSeek?.(target, { source });
    onSeekCommit(target, { source });
  };

  const onSeekKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const amount = event.shiftKey ? largeStep : step;
    const targets: Record<string, number> = {
      ArrowLeft: current - amount,
      ArrowDown: current - amount,
      ArrowRight: current + amount,
      ArrowUp: current + amount,
      PageDown: current - largeStep,
      PageUp: current + largeStep,
      Home: 0,
      End: length,
    };
    const target = targets[event.key];
    if (target === undefined || !seekable) return;
    event.preventDefault();
    setPointerFocus(false);
    seekTo(target, "keyboard");
  };

  const togglePlaying = () => {
    if (disabled || loading) return;
    if (!ended) return onPlayingChange(!playing);
    seekTo(0, "replay");
    onPlayingChange(true);
  };

  return (
    <PlaybackControlsContext.Provider
      value={{
        playing,
        time,
        duration: length > 0 ? length : null,
        seekable,
        ended,
        scrubbing,
        pointerFocus,
        loop,
        speed,
        speeds,
        loading,
        disabled,
        container,
        messages,
        formatTime,
        trackRef,
        thumbRef,
        seekHandlers,
        onSeekKeyDown,
        onThumbBlur: () => setPointerFocus(false),
        volumeState:
          volume === undefined
            ? null
            : {
                level,
                muted,
                dragging: volumeDrag.scrubbing,
                pointerFocus: volumeDrag.pointerFocus,
                trackRef: volumeTrackRef,
                thumbRef: volumeThumbRef,
                handlers: volumeDrag.seekHandlers,
                onKeyDown: onVolumeKeyDown,
                onThumbBlur: () => volumeDrag.setPointerFocus(false),
              },
        togglePlaying,
        restart: () => seekTo(0, "restart"),
        stepBy: (direction, size) => seekTo(current + direction * (size === "large" ? largeStep : step), "step"),
        setLoop: (next) => onLoopChange?.(next),
        setSpeed: (next) => onSpeedChange?.(next),
      }}
    >
      <Tooltip.Provider delay={400}>
        <div ref={ref} role="group" aria-label={label} aria-busy={loading || undefined} data-slot="playback-controls" data-disabled={disabled ? "" : undefined} className={cn("@container/playback grid w-full min-w-0 gap-1", className)} {...props}>
          {children ?? (
            <>
              {/* Together when wide. On phones and in narrow spaces, the times sit at either end of the bar. */}
              <PlaybackControlsRow className="flex-nowrap gap-3 max-sm:gap-2 max-sm:px-3 @max-xs/playback:gap-2 @max-xs/playback:px-3">
                <PlaybackTime show="current" className="hidden max-sm:inline @max-xs/playback:inline" />
                <PlaybackSeek />
                <PlaybackTime show="duration" className="hidden max-sm:inline @max-xs/playback:inline" />
                <PlaybackTime className="max-sm:hidden @max-xs/playback:hidden" />
              </PlaybackControlsRow>
              <PlaybackTransport />
            </>
          )}
        </div>
      </Tooltip.Provider>
    </PlaybackControlsContext.Provider>
  );
});
