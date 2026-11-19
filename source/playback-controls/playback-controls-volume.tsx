"use client";

import { Popover } from "@base-ui/react/popover";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { PlaybackButton, line } from "./playback-controls-buttons";
import { PlaybackSlider } from "./playback-controls-seek";
import { type PlaybackVolumeState, usePlaybackControls } from "./playback-controls-state";
import { cn } from "@/lib/utils";

const speaker = "M2.5 6.2v3.6h2.3L8 12.5v-9L4.8 6.2Z";
const volumeIcons = {
  off: line(`${speaker}M11 6.3l3 3.4M14 6.3l-3 3.4`),
  low: line(`${speaker}M10.7 6.2a2.6 2.6 0 0 1 0 3.6`),
  high: line(`${speaker}M10.7 6.2a2.6 2.6 0 0 1 0 3.6M12.6 4.3a5.3 5.3 0 0 1 0 7.4`),
};
const volumeIcon = (level: number) => (level === 0 ? volumeIcons.off : level < 0.5 ? volumeIcons.low : volumeIcons.high);

type SliderProps = { state: PlaybackVolumeState; orientation: "horizontal" | "vertical"; className?: string };

function VolumeSlider({ state, orientation, className }: SliderProps) {
  const { disabled, messages } = usePlaybackControls();
  const percent = Math.round(state.level * 100);
  return (
    <PlaybackSlider
      slot="playback-volume-slider"
      name={messages.volume}
      orientation={orientation}
      ratio={state.level}
      max={100}
      now={percent}
      text={`${percent}%`}
      enabled={!disabled}
      blocked={disabled}
      active={state.dragging}
      pointerFocus={state.pointerFocus}
      trackRef={state.trackRef}
      thumbRef={state.thumbRef}
      handlers={state.handlers}
      onThumbKeyDown={state.onKeyDown}
      onThumbBlur={state.onThumbBlur}
      className={className}
    />
  );
}

/** A horizontal level slider, for the three-dot menu. */
export function PlaybackVolumeRow() {
  const { volumeState, messages } = usePlaybackControls();
  if (!volumeState) return null;
  return (
    <div data-slot="playback-volume-row" className="flex h-[var(--uicoolkit-field-height,2.5rem)] items-center gap-2">
      <span aria-hidden className="flex-1 truncate text-sm text-muted-foreground">
        {messages.volume}
      </span>
      <VolumeSlider state={volumeState} orientation="horizontal" className="w-44" />
    </div>
  );
}

/** A speaker button that opens a vertical level slider. It shows only when your app passes volume. */
export const PlaybackVolume = forwardRef<HTMLButtonElement, Omit<ComponentPropsWithoutRef<"button">, "children" | "aria-label" | "aria-pressed">>(function PlaybackVolume({ className, ...props }, ref) {
  const { volumeState, disabled, container, messages } = usePlaybackControls();
  if (!volumeState) return null;
  return (
    <Popover.Root>
      <Popover.Trigger render={<PlaybackButton ref={ref} data-slot="playback-volume" label={messages.volume} icon={volumeIcon(volumeState.level)} disabled={disabled} className={cn("data-[popup-open]:bg-foreground/10 data-[popup-open]:text-foreground", className)} {...props} />} />
      <Popover.Portal container={container ?? undefined}>
        <Popover.Positioner side="top" sideOffset={6} positionMethod="fixed" className="z-50">
          <Popover.Popup
            data-slot="playback-volume-popup"
            className="flex origin-[var(--transform-origin)] flex-col items-center gap-1 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none transition-[transform,opacity] duration-150 ease-out data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none"
          >
            <span aria-hidden className="pt-1 text-xs text-muted-foreground tabular-nums">
              {Math.round(volumeState.level * 100)}
            </span>
            <VolumeSlider state={volumeState} orientation="vertical" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
});
