"use client";

import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { type PlaybackSeekDetail, useIsomorphicLayoutEffect } from "./playback-controls-state";
import { clampTime } from "./playback-controls-time";

type Options = {
  time: number;
  duration: number;
  enabled: boolean;
  trackRef: { current: HTMLDivElement | null };
  thumbRef: { current: HTMLDivElement | null };
  setLive: (time: number | null) => void;
  onSeek?: (time: number, detail: PlaybackSeekDetail) => void;
  onSeekCommit: (time: number, detail: PlaybackSeekDetail) => void;
  onScrubbingChange?: (scrubbing: boolean) => void;
};

type Scrub = { id: number; start: number; last: number; element: HTMLElement };

const detail: PlaybackSeekDetail = { source: "pointer" };

/** Press the seek bar to jump, drag to scrub and press Escape to return to the start. */
export function usePlaybackScrub(options: Options) {
  const [scrubbing, setScrubbing] = useState(false);
  const [pointerFocus, setPointerFocus] = useState(false);
  const scrub = useRef<Scrub | null>(null);
  const latest = useRef(options);
  useIsomorphicLayoutEffect(() => {
    latest.current = options;
  });

  const update = useCallback((active: Scrub, clientX: number, clientY: number) => {
    const { duration, trackRef, setLive, onSeek } = latest.current;
    const track = trackRef.current;
    const box = track?.getBoundingClientRect();
    if (!track || !box || box.width === 0 || box.height === 0) return;
    // A vertical track fills from the bottom.
    const ratio = track.dataset.orientation === "vertical" ? 1 - (clientY - box.top) / box.height : (clientX - box.left) / box.width;
    const next = clampTime(Math.round(ratio * duration * 100) / 100, duration);
    if (next === active.last) return;
    active.last = next;
    setLive(next);
    onSeek?.(next, detail);
  }, []);

  const finish = useCallback((cancel: boolean) => {
    const active = scrub.current;
    if (!active) return;
    scrub.current = null;
    const { setLive, onSeek, onSeekCommit, onScrubbingChange } = latest.current;
    const changed = active.start !== active.last;
    if (changed && cancel) onSeek?.(active.start, detail);
    if (changed && !cancel) onSeekCommit(active.last, detail);
    setLive(null);
    setScrubbing(false);
    onScrubbingChange?.(false);
    if (active.element.hasPointerCapture?.(active.id)) active.element.releasePointerCapture(active.id);
  }, []);

  useEffect(() => {
    if (!scrubbing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      finish(true);
    };
    const onBlur = () => finish(true);
    const onPointerEnd = (event: globalThis.PointerEvent) => {
      if (scrub.current?.id === event.pointerId) finish(event.type === "pointercancel");
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [scrubbing, finish]);

  useEffect(() => () => finish(true), [finish]);

  const seekHandlers = {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (event.defaultPrevented || event.button !== 0 || !options.enabled || scrub.current) return;
      event.preventDefault();
      const active: Scrub = { id: event.pointerId, start: options.time, last: options.time, element: event.currentTarget };
      scrub.current = active;
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        // The pointer may already have ended; the window listener still finishes the drag.
      }
      setPointerFocus(true);
      options.thumbRef.current?.focus({ preventScroll: true });
      setScrubbing(true);
      options.onScrubbingChange?.(true);
      update(active, event.clientX, event.clientY);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const active = scrub.current;
      if (active?.id === event.pointerId) update(active, event.clientX, event.clientY);
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
      if (scrub.current?.id === event.pointerId) finish(false);
    },
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => {
      if (scrub.current?.id === event.pointerId) finish(true);
    },
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => {
      if (scrub.current?.id === event.pointerId) finish(true);
    },
  };

  return { scrubbing, pointerFocus, setPointerFocus, seekHandlers, isScrubbing: () => scrub.current !== null };
}
