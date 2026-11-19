"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";
import { InspectorField, InspectorFieldLabel, InspectorFieldSelect } from "@/components/ui/inspector-field";
import { usePlaybackControls } from "./playback-controls-state";
import { cn } from "@/lib/utils";

type PartProps = Omit<ComponentPropsWithoutRef<"button">, "children" | "aria-label" | "aria-pressed">;
type ButtonProps = PartProps & { label: string; icon: ReactNode; pressed?: boolean };

export const line = (path: string, className?: string) => (
  <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);
export const solid = (path: string) => (
  <svg aria-hidden viewBox="0 0 16 16" fill="currentColor">
    <path d={path} />
  </svg>
);

const icons = {
  play: solid("M5 3.2v9.6c0 .4.4.6.8.4l7.2-4.8a.5.5 0 0 0 0-.8L5.8 2.8c-.4-.2-.8 0-.8.4Z"),
  pause: solid("M4.5 3h2v10h-2a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5Zm5 0h2a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-2V3Z"),
  replay: line("M3 8a5 5 0 1 0 1.5-3.6L3 5.8M3 2.8v3h3"),
  restart: solid("M3 3.2h1.6v9.6H3ZM13 3.8v8.4a.5.5 0 0 1-.8.4L6.3 8.4a.5.5 0 0 1 0-.8l5.9-4.2a.5.5 0 0 1 .8.4Z"),
  rewind: solid("M8 4v8a.5.5 0 0 1-.8.4l-5.3-4a.5.5 0 0 1 0-.8l5.3-4A.5.5 0 0 1 8 4Zm6.5 0v8a.5.5 0 0 1-.8.4l-5.3-4a.5.5 0 0 1 0-.8l5.3-4a.5.5 0 0 1 .8.4Z"),
  fastForward: solid("M1.5 4v8a.5.5 0 0 0 .8.4l5.3-4a.5.5 0 0 0 0-.8l-5.3-4a.5.5 0 0 0-.8.4ZM8 4v8a.5.5 0 0 0 .8.4l5.3-4a.5.5 0 0 0 0-.8l-5.3-4A.5.5 0 0 0 8 4Z"),
  back: line("M9.5 3.5 5 8l4.5 4.5"),
  forward: line("M6.5 3.5 11 8l-4.5 4.5"),
  loop: line("M11 1.8 13.2 4 11 6.2M2.8 7.5V6a2 2 0 0 1 2-2h8.4M5 14.2 2.8 12 5 9.8M13.2 8.5V10a2 2 0 0 1-2 2H2.8"),
  loading: line("M8 2.5A5.5 5.5 0 1 0 13.5 8", "animate-spin motion-reduce:animate-none"),
};

const buttonClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md outline-none transition-colors select-none disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none pointer-coarse:h-11 [&_svg]:size-4";

/** An icon button with its name in a tooltip. */
export const PlaybackButton = forwardRef<HTMLButtonElement, ButtonProps>(function PlaybackButton({ label, icon, pressed, className, ...props }, ref) {
  const { container } = usePlaybackControls();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <button
            ref={ref}
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            className={cn(buttonClass, "text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground aria-pressed:bg-primary/10 aria-pressed:text-foreground", className)}
            {...props}
          >
            {icon}
          </button>
        }
      />
      <Tooltip.Portal container={container ?? undefined}>
        <Tooltip.Positioner side="top" sideOffset={6} className="z-50">
          <Tooltip.Popup className="rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md pointer-coarse:hidden">{label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});

/** Plays and pauses. It becomes Replay at the end, and shows a spinner while loading. */
export const PlaybackPlayButton = forwardRef<HTMLButtonElement, PartProps>(function PlaybackPlayButton({ className, onClick, ...props }, ref) {
  const { playing, ended, loading, disabled, messages, togglePlaying } = usePlaybackControls();
  const [label, icon] = loading ? [messages.loading, icons.loading] : ended ? [messages.replay, icons.replay] : playing ? [messages.pause, icons.pause] : [messages.play, icons.play];
  return (
    <PlaybackButton
      ref={ref}
      data-slot="playback-play"
      label={label}
      icon={icon}
      disabled={disabled || loading}
      className={cn("size-9 rounded-full bg-primary text-primary-foreground pointer-coarse:size-11 hover:bg-primary/90 hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/40", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) togglePlaying();
      }}
      {...props}
    />
  );
});

/** Returns to the start. Playback keeps its current state. */
export const PlaybackRestartButton = forwardRef<HTMLButtonElement, PartProps>(function PlaybackRestartButton({ onClick, ...props }, ref) {
  const { seekable, messages, restart } = usePlaybackControls();
  return (
    <PlaybackButton
      ref={ref}
      data-slot="playback-restart"
      label={messages.restart}
      icon={icons.restart}
      disabled={!seekable}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) restart();
      }}
      {...props}
    />
  );
});

type StepProps = PartProps & {
  direction: "back" | "forward";
  /** Large is Rewind and Fast forward. Small steps finely, such as frame by frame. */
  size?: "large" | "small";
};

/** Moves back or forward: by largeStep as Rewind and Fast forward, or by step when small. */
export const PlaybackStepButton = forwardRef<HTMLButtonElement, StepProps>(function PlaybackStepButton({ direction, size = "large", onClick, ...props }, ref) {
  const { seekable, messages, stepBy } = usePlaybackControls();
  const back = direction === "back";
  const large = size === "large";
  return (
    <PlaybackButton
      ref={ref}
      data-slot="playback-step"
      label={large ? (back ? messages.rewind : messages.fastForward) : back ? messages.stepBack : messages.stepForward}
      icon={large ? (back ? icons.rewind : icons.fastForward) : back ? icons.back : icons.forward}
      disabled={!seekable}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) stepBy(back ? -1 : 1, size);
      }}
      {...props}
    />
  );
});

/** Turns looping on and off. It shows only when your app passes loop. */
export const PlaybackLoopButton = forwardRef<HTMLButtonElement, PartProps>(function PlaybackLoopButton({ onClick, ...props }, ref) {
  const { loop, disabled, messages, setLoop } = usePlaybackControls();
  if (loop === undefined) return null;
  return (
    <PlaybackButton
      ref={ref}
      data-slot="playback-loop"
      label={messages.loop}
      icon={icons.loop}
      pressed={loop}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setLoop(!loop);
      }}
      {...props}
    />
  );
});

/** The speeds to offer, always including the current one. */
export const speedChoices = (speed: number, speeds: number[]) => (speeds.includes(speed) ? speeds : [...speeds, speed].sort((a, b) => a - b));

/** A menu of playback speeds. It shows only when your app passes speed. */
export const PlaybackSpeed = forwardRef<HTMLDivElement, Omit<ComponentPropsWithoutRef<"div">, "children">>(function PlaybackSpeed({ className, style, ...props }, ref) {
  const { speed, speeds, disabled, container, messages, setSpeed } = usePlaybackControls();
  if (speed === undefined) return null;
  const choices = speedChoices(speed, speeds);
  return (
    <InspectorField
      ref={ref}
      data-slot="playback-speed"
      label={messages.speed}
      align="start"
      disabled={disabled}
      className={cn("block w-20", className)}
      style={{ "--uicoolkit-field-height": "2rem", ...style } as ComponentPropsWithoutRef<"div">["style"]}
      {...props}
    >
      {/* Names the menu for screen readers; its current choice says enough on screen. */}
      <InspectorFieldLabel className="sr-only" />
      <InspectorFieldSelect
        value={String(speed)}
        options={choices.map((choice) => ({ value: String(choice), label: messages.speedValue(choice) }))}
        container={container}
        positionMethod={container ? "fixed" : undefined}
        onCommit={(next) => setSpeed(Number(next))}
      />
    </InspectorField>
  );
});
