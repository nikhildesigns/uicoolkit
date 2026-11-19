"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import type { StackNotification } from "./notification-card";

// Use the layout height so an in-flight depth scale cannot feed back into the next offset.
export function useCardHeights(list: RefObject<HTMLOListElement | null>, items: readonly StackNotification[], count: number) {
  const [heights, setHeights] = useState<ReadonlyMap<string, number>>(() => new Map());
  useLayoutEffect(() => {
    if (!list.current) return;
    const cards = Array.from(list.current.querySelectorAll<HTMLElement>("li[data-notification-id]:not([aria-hidden=true])"));
    function measure() {
      const next = new Map(cards.map(card => {
        const css = getComputedStyle(card);
        const height = css.boxSizing === "border-box" ? parseFloat(css.height) : card.offsetHeight;
        return [card.dataset.notificationId!, height || card.offsetHeight];
      }));
      setHeights(previous => previous.size === next.size && [...next].every(([id, h]) => previous.get(id) === h) ? previous : next);
    }
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [list, items, count]);
  return heights;
}

export function notificationLayout(items: readonly StackNotification[], heights: ReadonlyMap<string, number>,
  expanded: boolean, position: "top" | "bottom") {
  // Work from the front card toward the back. A tall card can protrude at the far edge,
  // but never beyond the near edge of the card in front of it.
  const newestFirst = position === "top" ? items : [...items].reverse();
  const offsets = new Map<string, number>();
  let extent = 0;
  for (const [depth, item] of newestFirst.entries()) {
    const height = heights.get(item.id) || 70;
    const offset = depth === 0 ? 0 : expanded ? extent + 8 : Math.max(0, extent + 12 - height);
    offsets.set(item.id, offset);
    extent = offset + height;
  }
  if (position === "top") {
    for (const item of items) {
      offsets.set(item.id, extent - offsets.get(item.id)! - (heights.get(item.id) || 70));
    }
  }
  return { height: extent, offsets };
}
