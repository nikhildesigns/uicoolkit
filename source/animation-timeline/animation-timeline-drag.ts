"use client";

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { type TimelineEdge, type TimelineItem, type TimelineTrack, itemEdges, itemEnd, itemStart, moveItems, resizeClip, roundTime, sameItems, snapDelta } from "./animation-timeline-math";
import { type AnimationTimelineDetail, useIsomorphicLayoutEffect } from "./animation-timeline-state";

type Options = {
  items: TimelineItem[];
  tracks: TimelineTrack[];
  selection: string[];
  duration: number;
  currentTime: number;
  snap: boolean;
  snapInterval: number;
  pixelsPerSecond: number;
  minClipDuration: number;
  scrollerRef: { current: HTMLDivElement | null };
  namesRef: { current: HTMLDivElement | null };
  laneRef: { current: HTMLDivElement | null };
  isEditable: (item: TimelineItem) => boolean;
  setLive: (items: TimelineItem[] | null) => void;
  onSelectionChange: (ids: string[]) => void;
  onItemsChange?: (items: TimelineItem[], detail: AnimationTimelineDetail) => void;
  onItemsCommit: (items: TimelineItem[], detail: AnimationTimelineDetail) => void;
};

type Drag = {
  pointerId: number;
  id: string;
  edge?: TimelineEdge;
  ids: string[];
  shift: boolean;
  wasSelected: boolean;
  armed: boolean;
  moved: boolean;
  alt: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startOffsetY: number;
  startTime: number;
  startItems: TimelineItem[];
  last: TimelineItem[];
  targets: number[];
  edges: number[];
  stop: () => void;
};

const touchHold = 250;
const touchSlop = 8;
const dragThreshold = 3;
const snapPixels = 6;
const edgeZone = 32;
const edgeSpeed = 10;

/** Press and drag items. Touch waits for a short hold so scrolling never moves a clip. Escape cancels. */
export function useTimelineDrag(options: Options) {
  const latest = useRef(options);
  useIsomorphicLayoutEffect(() => {
    latest.current = options;
  });
  const active = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const [draggingIds, setDraggingIds] = useState<string[]>([]);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [guide, setGuide] = useState<number | null>(null);

  const detailOf = (drag: Drag): AnimationTimelineDetail => ({ action: drag.edge ? "resize" : "move", ids: drag.ids });

  const timeAt = (clientX: number) => {
    const { laneRef, pixelsPerSecond } = latest.current;
    const left = laneRef.current?.getBoundingClientRect().left ?? 0;
    return (clientX - left) / pixelsPerSecond;
  };

  const applyPress = (drag: Drag) => {
    const { selection, onSelectionChange } = latest.current;
    if (drag.wasSelected) return;
    onSelectionChange(drag.shift ? [...selection, drag.id] : [drag.id]);
  };

  const apply = () => {
    const drag = active.current;
    if (!drag?.moved) return;
    const { laneRef, tracks, duration, snap, snapInterval, pixelsPerSecond, minClipDuration, setLive, onItemsChange } = latest.current;
    const raw = timeAt(drag.lastX) - drag.startTime;
    const found = snap && !drag.alt ? snapDelta(drag.edges.map((edge) => edge + raw), drag.targets, snapInterval, snapPixels / pixelsPerSecond) : null;
    const delta = raw + (found?.delta ?? 0);
    let next: TimelineItem[];
    if (drag.edge) {
      next = resizeClip(drag.startItems, drag.id, drag.edge, delta, minClipDuration, duration);
    } else {
      const rect = laneRef.current?.getBoundingClientRect();
      const rowHeight = rect && tracks.length ? rect.height / tracks.length : 0;
      const shift = rect && rowHeight ? Math.round((drag.lastY - rect.top - drag.startOffsetY) / rowHeight) : 0;
      next = moveItems(drag.startItems, drag.ids, delta, shift, tracks, duration);
    }
    setGuide(found ? roundTime(found.at) : null);
    if (sameItems(next, drag.last)) return;
    drag.last = next;
    setLive(next);
    onItemsChange?.(next, detailOf(drag));
  };

  const finish = (commit: boolean) => {
    const drag = active.current;
    if (!drag) return;
    active.current = null;
    drag.stop();
    setDraggingIds([]);
    setArmedId(null);
    setGuide(null);
    const { selection, setLive, onSelectionChange, onItemsChange, onItemsCommit } = latest.current;
    if (drag.moved) {
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      setLive(null);
      if (commit && !sameItems(drag.last, drag.startItems)) onItemsCommit(drag.last, detailOf(drag));
      else if (!sameItems(drag.last, drag.startItems)) onItemsChange?.(drag.startItems, detailOf(drag));
      return;
    }
    if (!commit) return;
    if (!drag.armed) applyPress(drag);
    if (drag.wasSelected && drag.shift) onSelectionChange(selection.filter((id) => id !== drag.id));
    else if (drag.wasSelected && selection.length > 1) onSelectionChange([drag.id]);
  };

  const begin = (event: ReactPointerEvent<HTMLElement>, item: TimelineItem, edge?: TimelineEdge) => {
    const { items, selection, isEditable, currentTime, duration, laneRef } = latest.current;
    if (event.button !== 0 || event.ctrlKey || active.current || !isEditable(item)) return;
    event.stopPropagation();
    const wasSelected = selection.includes(item.id);
    const selected = items.filter((candidate) => selection.includes(candidate.id) && isEditable(candidate)).map((candidate) => candidate.id);
    const ids = edge ? [item.id] : wasSelected ? selected : event.shiftKey ? [...selected, item.id] : [item.id];
    const moving = items.filter((candidate) => ids.includes(candidate.id));
    const edges = edge ? [edge === "start" ? itemStart(item) : itemEnd(item)] : moving.flatMap(itemEdges);
    const others = items.filter((candidate) => !ids.includes(candidate.id)).flatMap(itemEdges);
    const element = event.currentTarget;
    const pointerId = event.pointerId;
    const holdFirst = event.pointerType === "touch" && !edge;
    let frame = 0;
    let timer = 0;

    const onMove = (next: PointerEvent) => {
      const drag = active.current;
      if (!drag || next.pointerId !== pointerId) return;
      drag.lastX = next.clientX;
      drag.lastY = next.clientY;
      drag.alt = next.altKey;
      const distance = Math.hypot(next.clientX - drag.startX, next.clientY - drag.startY);
      if (!drag.armed) {
        if (distance > touchSlop) finish(false);
        return;
      }
      if (!drag.moved) {
        if (distance < dragThreshold) return;
        drag.moved = true;
        setDraggingIds(drag.ids);
        frame = requestAnimationFrame(tick);
      }
      apply();
    };
    const tick = () => {
      const drag = active.current;
      const { scrollerRef, namesRef } = latest.current;
      const scroller = scrollerRef.current;
      if (!drag || !scroller) return;
      const rect = scroller.getBoundingClientRect();
      const left = rect.left + (namesRef.current?.offsetWidth ?? 0) + edgeZone;
      const right = rect.right - edgeZone;
      const speed = drag.lastX < left ? -edgeSpeed : drag.lastX > right ? edgeSpeed : 0;
      const before = scroller.scrollLeft;
      if (speed) scroller.scrollLeft = before + speed;
      if (scroller.scrollLeft !== before) apply();
      frame = requestAnimationFrame(tick);
    };
    const onUp = (next: PointerEvent) => void (next.pointerId === pointerId && finish(true));
    const onCancel = (next: PointerEvent) => void (next.pointerId === pointerId && finish(false));
    const onKey = (next: KeyboardEvent) => {
      if (next.key !== "Escape") return;
      next.preventDefault();
      next.stopPropagation();
      finish(false);
    };
    const onBlur = () => finish(false);
    // Once a held finger is dragging, the page must not start scrolling.
    const onTouchMove = (next: TouchEvent) => {
      if (active.current?.armed) next.preventDefault();
    };
    const listening = new AbortController();
    const { signal } = listening;
    window.addEventListener("pointermove", onMove, { signal });
    window.addEventListener("pointerup", onUp, { signal });
    window.addEventListener("pointercancel", onCancel, { signal });
    window.addEventListener("keydown", onKey, { signal, capture: true });
    window.addEventListener("blur", onBlur, { signal });
    if (holdFirst) window.addEventListener("touchmove", onTouchMove, { signal, passive: false });

    const laneTop = laneRef.current?.getBoundingClientRect().top ?? 0;
    const drag: Drag = {
      pointerId,
      id: item.id,
      edge,
      ids,
      shift: event.shiftKey,
      wasSelected,
      armed: !holdFirst,
      moved: false,
      alt: event.altKey,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      startOffsetY: event.clientY - laneTop,
      startTime: timeAt(event.clientX),
      startItems: items,
      last: items,
      targets: [0, duration, currentTime, ...others],
      edges,
      stop: () => {
        cancelAnimationFrame(frame);
        window.clearTimeout(timer);
        listening.abort();
      },
    };
    active.current = drag;
    if (holdFirst) {
      timer = window.setTimeout(() => {
        drag.armed = true;
        setArmedId(item.id);
        applyPress(drag);
      }, touchHold);
      return;
    }
    applyPress(drag);
    try {
      element.setPointerCapture?.(pointerId);
    } catch {
      // The pointer may already have ended.
    }
  };

  useEffect(() => () => active.current?.stop(), []);

  return { begin, cancel: () => finish(false), draggingIds, armedId, guide, clickSuppressed: () => suppressClick.current };
}
