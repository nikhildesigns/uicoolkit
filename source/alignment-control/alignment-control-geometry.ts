import type { AlignmentAction, AlignmentPosition } from "./alignment-control-state";

/** A layer's box, in your canvas's units. */
export type AlignmentRect = { id: string; x: number; y: number; width: number; height: number };
export type AlignmentBounds = Omit<AlignmentRect, "id">;

/** The box around every rect. */
export function boundsOf(rects: AlignmentBounds[]): AlignmentBounds {
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

const place = (start: number, size: number, span: number, at: AlignmentPosition["x"]) =>
  at === "start" ? start : at === "end" ? start + span - size : start + (span - size) / 2;

/**
 * Applies an action to the selected rects, in their original order. One rect aligns to `parent`,
 * several to their own bounds. Distributing keeps the outer two in place and evens the gaps between all of them.
 */
export function alignRects<T extends AlignmentRect>(rects: T[], action: AlignmentAction, parent?: AlignmentBounds): T[] {
  if (rects.length === 0) return rects;
  if (action === "distribute-horizontal" || action === "distribute-vertical") {
    if (rects.length < 3) return rects;
    const horizontal = action === "distribute-horizontal";
    const start = (rect: AlignmentRect) => (horizontal ? rect.x : rect.y);
    const size = (rect: AlignmentRect) => (horizontal ? rect.width : rect.height);
    const sorted = [...rects].sort((a, b) => start(a) - start(b));
    const first = start(sorted[0]);
    const last = Math.max(...sorted.map((rect) => start(rect) + size(rect)));
    const gap = (last - first - sorted.reduce((sum, rect) => sum + size(rect), 0)) / (sorted.length - 1);
    const moved = new Map<string, number>();
    let cursor = first;
    for (const rect of sorted) {
      moved.set(rect.id, cursor);
      cursor += size(rect) + gap;
    }
    return rects.map((rect) => ({ ...rect, [horizontal ? "x" : "y"]: moved.get(rect.id)! }));
  }
  const bounds = rects.length === 1 && parent ? parent : boundsOf(rects);
  return rects.map((rect) => {
    switch (action) {
      case "left":
        return { ...rect, x: bounds.x };
      case "center":
        return { ...rect, x: place(bounds.x, rect.width, bounds.width, "center") };
      case "right":
        return { ...rect, x: place(bounds.x, rect.width, bounds.width, "end") };
      case "top":
        return { ...rect, y: bounds.y };
      case "middle":
        return { ...rect, y: place(bounds.y, rect.height, bounds.height, "center") };
      default:
        return { ...rect, y: place(bounds.y, rect.height, bounds.height, "end") };
    }
  });
}

/** Moves a rect to a grid position inside its parent. */
export function positionRect<T extends AlignmentBounds>(rect: T, position: AlignmentPosition, parent: AlignmentBounds): T {
  return { ...rect, x: place(parent.x, rect.width, parent.width, position.x), y: place(parent.y, rect.height, parent.height, position.y) };
}

/** Where a rect sits in its parent, or null when it is not at one of the nine positions. */
export function positionOf(rect: AlignmentBounds, parent: AlignmentBounds, tolerance = 0.5): AlignmentPosition | null {
  const axis = (start: number, size: number, from: number, span: number) =>
    (["start", "center", "end"] as const).find((at) => Math.abs(place(from, size, span, at) - start) <= tolerance) ?? null;
  const x = axis(rect.x, rect.width, parent.x, parent.width);
  const y = axis(rect.y, rect.height, parent.y, parent.height);
  return x && y ? { x, y } : null;
}
