"use client";

import { type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent, createContext, useContext, useEffect, useLayoutEffect } from "react";
import type { TimelineEdge, TimelineItem, TimelineTrack } from "./animation-timeline-math";

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Replaceable text, for example to translate. */
export type AnimationTimelineMessages = {
  playback: string;
  zoom: string;
  fit: string;
  playhead: string;
  hide: string;
  show: string;
  lock: string;
  unlock: string;
  trackOptions: (track: string) => string;
  duplicate: string;
  delete: string;
  empty: string;
  /** Read with every item. */
  instructions: string;
  clip: (label: string, track: string, start: string, end: string) => string;
  keyframe: (label: string, track: string, time: string) => string;
  untitledClip: string;
  untitledKeyframe: string;
};

export const defaultMessages: AnimationTimelineMessages = {
  playback: "Timeline playback",
  zoom: "Zoom",
  fit: "Fit",
  playhead: "Playhead",
  hide: "Hide",
  show: "Show",
  lock: "Lock",
  unlock: "Unlock",
  trackOptions: (track) => `${track} options`,
  duplicate: "Duplicate",
  delete: "Delete",
  empty: "Nothing is animated yet.",
  instructions: "Arrow keys move. Shift moves further. Alt with Left or Right changes the end; add Shift to change the start.",
  clip: (label, track, start, end) => `${label}, ${track}, from ${start} to ${end}`,
  keyframe: (label, track, time) => `${label}, ${track}, at ${time}`,
  untitledClip: "Clip",
  untitledKeyframe: "Keyframe",
};

/** What changed, and which items. */
export type AnimationTimelineDetail = { action: "move" | "resize"; ids: string[] };

/** Fit shows the whole timeline; a number zooms in from it, in percent. */
export type AnimationTimelineZoomValue = "fit" | number;

export const defaultZoomLevels = [150, 200, 300, 400];

export type AnimationTimelineProps = Omit<ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue"> & {
  /** Names the timeline for screen readers. */
  label: string;
  /** Rows from top to bottom. Your app owns them. */
  tracks: TimelineTrack[];
  /** Clips and keyframes. Your app owns them. */
  items: TimelineItem[];
  /** The length in seconds. */
  duration: number;
  /** Selected item ids. Your app owns them. */
  selection: string[];
  onSelectionChange: (ids: string[]) => void;
  /** Called once per finished drag or key press, for saving and undo. */
  onItemsCommit: (items: TimelineItem[], detail: AnimationTimelineDetail) => void;
  /** Called with live items while dragging, and the starting items when a drag is cancelled. */
  onItemsChange?: (items: TimelineItem[], detail: AnimationTimelineDetail) => void;
  /** The playhead in seconds. Your app owns it. */
  currentTime: number;
  /** Called once per finished ruler drag, key press or button. */
  onSeekCommit: (time: number) => void;
  /** Called with live positions, and the starting position when a drag is cancelled. */
  onSeek?: (time: number) => void;
  /** Whether playback is running. Your app runs it. */
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  /** Passing it shows the Loop button. */
  loop?: boolean;
  onLoopChange?: (loop: boolean) => void;
  /** Passing it shows Hide and Show for each track. */
  onTrackHiddenChange?: (trackId: string, hidden: boolean) => void;
  /** Passing it shows Lock and Unlock for each track. */
  onTrackLockedChange?: (trackId: string, locked: boolean) => void;
  /** Passing it adds Duplicate to the item menu. Your app creates the copies. */
  onDuplicate?: (ids: string[]) => void;
  /** Passing it adds Delete to the item menu. Your app removes the items. */
  onDelete?: (ids: string[]) => void;
  /** Seconds moved by arrow keys. */
  step?: number;
  /** Seconds moved with Shift. */
  largeStep?: number;
  /** The shortest a clip can be, in seconds. */
  minClipDuration?: number;
  /** Snap to the playhead, item edges and ruler ticks. Hold Alt while dragging to turn it off. */
  snap?: boolean;
  /** Width of one second until the available space is known. */
  pixelsPerSecond?: number;
  /** The starting zoom. Fit shows the whole timeline without sideways scrolling. */
  defaultZoom?: AnimationTimelineZoomValue;
  /** Percent choices in the Zoom menu, after Fit. */
  zoomLevels?: number[];
  /** The furthest Ctrl or Cmd + scroll can zoom in, in percent of Fit. */
  maxZoom?: number;
  formatTime?: (seconds: number) => string;
  /** Where menus and tooltips are portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  disabled?: boolean;
  messages?: Partial<AnimationTimelineMessages>;
};

export type AnimationTimelineContextValue = Pick<AnimationTimelineProps, "label" | "tracks" | "duration" | "selection" | "playing" | "onPlayingChange" | "loop" | "onLoopChange" | "onTrackHiddenChange" | "onTrackLockedChange" | "onDuplicate" | "onDelete" | "container"> & {
  items: TimelineItem[];
  time: number;
  disabled: boolean;
  step: number;
  largeStep: number;
  zoom: AnimationTimelineZoomValue;
  zoomLevels: number[];
  pixelsPerSecond: number;
  major: number;
  minor: number;
  guide: number | null;
  draggingIds: string[];
  armedId: string | null;
  scrubbing: boolean;
  messages: AnimationTimelineMessages;
  instructionsId: string;
  formatTime: (seconds: number) => string;
  scrollerRef: { current: HTMLDivElement | null };
  namesRef: { current: HTMLDivElement | null };
  laneRef: { current: HTMLDivElement | null };
  setZoom: (zoom: AnimationTimelineZoomValue) => void;
  seek: (time: number) => void;
  commitSeek: (time: number) => void;
  isEditable: (item: TimelineItem) => boolean;
  menuIds: (item: TimelineItem) => string[];
  beginDrag: (event: PointerEvent<HTMLElement>, item: TimelineItem, edge?: TimelineEdge) => void;
  cancelDrag: () => void;
  selectForMenu: (item: TimelineItem) => void;
  onItemKeyDown: (event: KeyboardEvent<HTMLElement>, item: TimelineItem) => void;
  onLaneClick: (target: Element, shift: boolean) => void;
  rulerHandlers: { onPointerDown: (event: PointerEvent<HTMLElement>) => void; onKeyDown: (event: KeyboardEvent<HTMLElement>) => void };
};

export const AnimationTimelineContext = createContext<AnimationTimelineContextValue | null>(null);

/** The live items, time and scale of the nearest AnimationTimeline, for custom parts. */
export function useAnimationTimeline() {
  const context = useContext(AnimationTimelineContext);
  if (!context) throw new Error("Animation Timeline parts must be rendered inside <AnimationTimeline>.");
  return context;
}
