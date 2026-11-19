"use client";

import { type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent, createContext, useContext, useEffect, useLayoutEffect } from "react";

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Replaceable text, for example to translate. */
export type PlaybackControlsMessages = {
  play: string;
  pause: string;
  replay: string;
  restart: string;
  rewind: string;
  fastForward: string;
  stepBack: string;
  stepForward: string;
  seek: string;
  loop: string;
  speed: string;
  volume: string;
  settings: string;
  close: string;
  loading: string;
  /** Shown in place of the duration while it is unknown. */
  unknownTime: string;
  /** Read with the seek bar. */
  seekValue: (current: string, total: string) => string;
  /** Names a speed in the menu. */
  speedValue: (speed: number) => string;
};

export const defaultMessages: PlaybackControlsMessages = {
  play: "Play",
  pause: "Pause",
  replay: "Replay",
  restart: "Restart",
  rewind: "Rewind",
  fastForward: "Fast forward",
  stepBack: "Step back",
  stepForward: "Step forward",
  seek: "Seek",
  loop: "Loop",
  speed: "Speed",
  volume: "Volume",
  settings: "Settings",
  close: "Close",
  loading: "Loading",
  unknownTime: "--:--",
  seekValue: (current, total) => `${current} of ${total}`,
  speedValue: (speed) => `${speed}×`,
};

/** Where a change of position came from. */
export type PlaybackSeekDetail = { source: "pointer" | "keyboard" | "step" | "restart" | "replay" };

export const defaultSpeeds = [0.25, 0.5, 1, 2];

export type PlaybackControlsProps = Omit<ComponentPropsWithoutRef<"div">, "onVolumeChange"> & {
  /** Names the controls for screen readers, such as "Animation playback". */
  label: string;
  /** Whether playback is running. Your app owns it. */
  playing: boolean;
  /** Called when Play or Pause is pressed, and with true on Replay. */
  onPlayingChange: (playing: boolean) => void;
  /** The position in seconds. Your app owns it. */
  currentTime: number;
  /** The length in seconds, or null while unknown. Seeking is off until it is known. */
  duration: number | null;
  /** Called once per finished drag, key press or button. Update currentTime here. */
  onSeekCommit: (time: number, detail: PlaybackSeekDetail) => void;
  /** Called with live positions, and with the starting position when a drag is cancelled. */
  onSeek?: (time: number, detail: PlaybackSeekDetail) => void;
  /** Called when a drag on the seek bar starts and ends, so your app can hold playback. */
  onScrubbingChange?: (scrubbing: boolean) => void;
  /** Seconds moved by small step buttons and arrow keys. */
  step?: number;
  /** Seconds moved by Rewind and Fast forward, and with Shift or Page Up and Page Down. */
  largeStep?: number;
  /** The level from 0 to 1. Passing it shows Volume. Your app owns it. */
  volume?: number;
  /** Called with live levels, and with the starting level when a drag is cancelled. */
  onVolumeChange?: (volume: number) => void;
  /** Called once per finished drag or key press. Update volume here. */
  onVolumeCommit?: (volume: number) => void;
  /** Shows the level as 0, for an app with its own mute. */
  muted?: boolean;
  /** Called with false when a commit raises the level. */
  onMutedChange?: (muted: boolean) => void;
  /** Passing it shows the Loop button. Your app owns it. */
  loop?: boolean;
  onLoopChange?: (loop: boolean) => void;
  /** Passing it shows the Speed menu. Your app owns it. */
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  speeds?: number[];
  /** Replaces the time format. */
  formatTime?: (seconds: number) => string;
  /** Shows that media is loading. Play and seeking wait until it ends. */
  loading?: boolean;
  disabled?: boolean;
  /** Where tooltips and the speed menu are portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  messages?: Partial<PlaybackControlsMessages>;
};

type SliderHandlers = {
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => void;
};

export type PlaybackVolumeState = {
  /** The level shown: live while dragging, and 0 while muted. */
  level: number;
  muted: boolean;
  dragging: boolean;
  pointerFocus: boolean;
  trackRef: { current: HTMLDivElement | null };
  thumbRef: { current: HTMLDivElement | null };
  handlers: SliderHandlers;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onThumbBlur: () => void;
};

export type PlaybackControlsContextValue = {
  playing: boolean;
  /** The live position while scrubbing, otherwise the current time. */
  time: number;
  duration: number | null;
  /** True when the position can change: not disabled or loading, with a known duration. */
  seekable: boolean;
  /** True at the end of playback with Loop off. */
  ended: boolean;
  scrubbing: boolean;
  pointerFocus: boolean;
  loop?: boolean;
  speed?: number;
  speeds: number[];
  loading: boolean;
  disabled: boolean;
  container?: HTMLElement | null;
  messages: PlaybackControlsMessages;
  formatTime: (seconds: number) => string;
  trackRef: { current: HTMLDivElement | null };
  thumbRef: { current: HTMLDivElement | null };
  seekHandlers: SliderHandlers;
  onSeekKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onThumbBlur: () => void;
  /** Present when your app passes volume. */
  volumeState: PlaybackVolumeState | null;
  togglePlaying: () => void;
  restart: () => void;
  stepBy: (direction: -1 | 1, size: "small" | "large") => void;
  setLoop: (loop: boolean) => void;
  setSpeed: (speed: number) => void;
};

export const PlaybackControlsContext = createContext<PlaybackControlsContextValue | null>(null);

/** The state and actions of the nearest PlaybackControls, for custom parts. */
export function usePlaybackControls() {
  const context = useContext(PlaybackControlsContext);
  if (!context) throw new Error("Playback parts must be rendered inside <PlaybackControls>.");
  return context;
}
