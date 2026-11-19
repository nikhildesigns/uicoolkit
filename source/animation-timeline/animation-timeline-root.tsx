"use client";

import { type KeyboardEvent, forwardRef, useEffect, useId, useRef, useState } from "react";
import { formatPlaybackTime } from "@/components/ui/playback-controls";
import { useTimelineDrag } from "./animation-timeline-drag";
import { type TimelineItem, defaultPixelsPerSecond, moveItems, resizeClip, rulerScale, sameItems } from "./animation-timeline-math";
import { AnimationTimelineBody } from "./animation-timeline-tracks";
import { AnimationTimelineToolbar } from "./animation-timeline-toolbar";
import { type AnimationTimelineDetail, type AnimationTimelineProps, AnimationTimelineContext, defaultMessages, defaultZoomLevels } from "./animation-timeline-state";
import { useTimelineScrub, useTimelineZoom } from "./animation-timeline-view";
import { cn } from "@/lib/utils";

/** Arranges clips and keyframes on tracks over time. Your app owns the data and runs playback. */
export const AnimationTimeline = forwardRef<HTMLDivElement, AnimationTimelineProps>(function AnimationTimeline(
  {
    label,
    tracks,
    items,
    duration,
    selection,
    onSelectionChange,
    onItemsCommit,
    onItemsChange,
    currentTime,
    onSeekCommit,
    onSeek,
    playing,
    onPlayingChange,
    loop,
    onLoopChange,
    onTrackHiddenChange,
    onTrackLockedChange,
    onDuplicate,
    onDelete,
    step = 0.1,
    largeStep = 1,
    minClipDuration = 0.1,
    snap = true,
    pixelsPerSecond: basePixels = defaultPixelsPerSecond,
    defaultZoom = "fit",
    zoomLevels = defaultZoomLevels,
    maxZoom = 800,
    formatTime = formatPlaybackTime,
    container,
    disabled = false,
    messages: messageOverrides,
    className,
    children,
    ...props
  },
  ref,
) {
  const messages = { ...defaultMessages, ...messageOverrides };
  const instructionsId = useId();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const namesRef = useRef<HTMLDivElement | null>(null);
  const laneRef = useRef<HTMLDivElement | null>(null);
  const [liveItems, setLiveItems] = useState<TimelineItem[] | null>(null);
  const [liveTime, setLiveTime] = useState<number | null>(null);
  const { zoom, pixelsPerSecond, setZoom } = useTimelineZoom({ initial: defaultZoom, max: maxZoom, duration, basePixels, hasTracks: tracks.length > 0, scrollerRef, namesRef, laneRef });
  const { major, minor } = rulerScale(pixelsPerSecond);
  const shownItems = liveItems ?? items;
  const time = liveTime ?? currentTime;

  const trackOf = (item: TimelineItem) => tracks.find((track) => track.id === item.trackId);
  const isEditable = (item: TimelineItem) => !disabled && !trackOf(item)?.locked;
  const editableIds = (ids: string[]) => items.filter((item) => ids.includes(item.id) && isEditable(item)).map((item) => item.id);
  const menuIds = (item: TimelineItem) => (selection.includes(item.id) ? editableIds(selection) : [item.id]);

  const drag = useTimelineDrag({ items, tracks, selection, duration, currentTime, snap, snapInterval: minor, pixelsPerSecond, minClipDuration, scrollerRef, namesRef, laneRef, isEditable, setLive: setLiveItems, onSelectionChange, onItemsChange, onItemsCommit });
  const scrub = useTimelineScrub({ time: currentTime, duration, items, snap, snapInterval: minor, step, largeStep, pixelsPerSecond, disabled, laneRef, setLive: setLiveTime, onSeek, onSeekCommit });

  // Keeps the playhead in view while playing.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!playing || !scroller) return;
    const names = namesRef.current?.offsetWidth ?? 0;
    const x = names + time * pixelsPerSecond;
    if (x < scroller.scrollLeft + names || x > scroller.scrollLeft + scroller.clientWidth - 12) scroller.scrollLeft = x - names - 12;
  }, [playing, time, pixelsPerSecond]);

  const edit = (next: TimelineItem[], detail: AnimationTimelineDetail) => {
    if (sameItems(next, items)) return;
    onItemsChange?.(next, detail);
    onItemsCommit(next, detail);
  };

  const onItemKeyDown = (event: KeyboardEvent<HTMLElement>, item: TimelineItem) => {
    if (!isEditable(item) || event.defaultPrevented) return;
    const selected = selection.includes(item.id);
    const ids = selected ? editableIds(selection) : [item.id];
    const amount = event.shiftKey && !event.altKey ? largeStep : step;
    const across = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const down = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    const command = event.metaKey || event.ctrlKey;
    const handled = () => {
      event.preventDefault();
      event.stopPropagation();
      if (!selected) onSelectionChange([item.id]);
    };
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (event.shiftKey) onSelectionChange(selected ? selection.filter((id) => id !== item.id) : [...selection, item.id]);
      else onSelectionChange([item.id]);
    } else if (event.key === "Escape" && selection.length) {
      event.preventDefault();
      onSelectionChange([]);
    } else if ((event.key === "Delete" || event.key === "Backspace") && onDelete) {
      handled();
      onDelete(ids);
    } else if (command && event.key.toLowerCase() === "d" && onDuplicate) {
      handled();
      onDuplicate(ids);
    } else if (across && event.altKey) {
      if (item.kind !== "clip") return;
      handled();
      edit(resizeClip(items, item.id, event.shiftKey ? "start" : "end", across * step, minClipDuration, duration), { action: "resize", ids: [item.id] });
    } else if ((across || down) && !command) {
      handled();
      edit(moveItems(items, ids, across * amount, down, tracks, duration), { action: "move", ids });
    }
  };

  return (
    <AnimationTimelineContext.Provider
      value={{
        label,
        tracks,
        items: shownItems,
        duration,
        selection,
        playing,
        onPlayingChange,
        loop,
        onLoopChange,
        onTrackHiddenChange,
        onTrackLockedChange,
        onDuplicate,
        onDelete,
        container,
        time,
        disabled,
        step,
        largeStep,
        zoom,
        zoomLevels,
        pixelsPerSecond,
        major,
        minor,
        guide: drag.guide,
        draggingIds: drag.draggingIds,
        armedId: drag.armedId,
        scrubbing: scrub.scrubbing,
        messages,
        instructionsId,
        formatTime,
        scrollerRef,
        namesRef,
        laneRef,
        setZoom,
        seek: (next) => onSeek?.(next),
        commitSeek: onSeekCommit,
        isEditable,
        menuIds,
        beginDrag: drag.begin,
        cancelDrag: drag.cancel,
        selectForMenu: (item) => {
          if (isEditable(item) && !selection.includes(item.id)) onSelectionChange([item.id]);
        },
        onItemKeyDown,
        onLaneClick: (target, shift) => {
          if (!disabled && !shift && !drag.clickSuppressed() && !target.closest("[data-timeline-item]") && selection.length) onSelectionChange([]);
        },
        rulerHandlers: scrub.handlers,
      }}
    >
      <div ref={ref} role="group" aria-label={label} data-slot="animation-timeline" data-disabled={disabled ? "" : undefined} className={cn("@container/timeline grid w-full min-w-0 content-start gap-2 text-sm", className)} {...props}>
        {children ?? (
          <>
            <AnimationTimelineToolbar />
            <AnimationTimelineBody />
          </>
        )}
      </div>
    </AnimationTimelineContext.Provider>
  );
});
