export type TimelineTrack = { id: string; label: string; hidden?: boolean; locked?: boolean };
export type TimelineClip = { id: string; kind: "clip"; trackId: string; start: number; duration: number; label?: string };
export type TimelineKeyframe = { id: string; kind: "keyframe"; trackId: string; time: number; label?: string };
export type TimelineItem = TimelineClip | TimelineKeyframe;
export type TimelineEdge = "start" | "end";

export const defaultPixelsPerSecond = 80;

const rulerSteps = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
const smallestLabelGap = 72;
const smallestTickGap = 10;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
export const roundTime = (time: number) => Math.round(time * 100) / 100;
export const itemStart = (item: TimelineItem) => (item.kind === "clip" ? item.start : item.time);
export const itemEnd = (item: TimelineItem) => (item.kind === "clip" ? item.start + item.duration : item.time);
export const itemEdges = (item: TimelineItem) => (item.kind === "clip" ? [item.start, item.start + item.duration] : [item.time]);

/** Labelled marks far enough apart to read, and the smaller ticks between them. */
export function rulerScale(pixelsPerSecond: number) {
  const major = rulerSteps.find((step) => step * pixelsPerSecond >= smallestLabelGap) ?? rulerSteps[rulerSteps.length - 1];
  const divisions = [5, 2].find((count) => (major * pixelsPerSecond) / count >= smallestTickGap) ?? 1;
  return { major, minor: major / divisions };
}

export function rulerMarks(duration: number, major: number) {
  const count = Math.floor(duration / major + 1e-6);
  return Array.from({ length: count + 1 }, (_, index) => roundTime(index * major));
}

export function formatRulerTime(time: number, major: number) {
  if (time < 60 && major < 60) return `${Number(time.toFixed(2))}s`;
  const minutes = Math.floor(time / 60);
  return `${minutes}:${String(Math.round(time - minutes * 60)).padStart(2, "0")}`;
}

/** The smallest shift that puts one candidate on a target or a ruler tick, if any is close enough. */
export function snapDelta(candidates: number[], targets: number[], interval: number, threshold: number) {
  let best: { delta: number; at: number } | null = null;
  const consider = (candidate: number, at: number) => {
    const delta = at - candidate;
    if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, at };
  };
  for (const candidate of candidates) {
    for (const target of targets) consider(candidate, target);
    if (interval > 0) consider(candidate, Math.round(candidate / interval) * interval);
  }
  return best as { delta: number; at: number } | null;
}

/** Moves items together in time and across tracks. The group keeps its shape at the limits. */
export function moveItems(items: TimelineItem[], ids: string[], delta: number, trackShift: number, tracks: TimelineTrack[], duration: number) {
  const moving = items.filter((item) => ids.includes(item.id));
  if (!moving.length) return items;
  const earliest = Math.min(...moving.map(itemStart));
  const latest = Math.max(...moving.map(itemEnd));
  const applied = clamp(delta, -earliest, duration - latest);
  const position = new Map(tracks.map((track, index) => [track.id, index]));
  const destination = (item: TimelineItem) => tracks[(position.get(item.trackId) ?? -1) + trackShift];
  const shift = trackShift !== 0 && moving.every((item) => destination(item) && !destination(item).locked);
  return items.map((item) => {
    if (!ids.includes(item.id)) return item;
    const trackId = shift ? destination(item).id : item.trackId;
    return item.kind === "clip" ? { ...item, trackId, start: roundTime(item.start + applied) } : { ...item, trackId, time: roundTime(item.time + applied) };
  });
}

/** Moves one edge of a clip, keeping the other edge where it is. */
export function resizeClip(items: TimelineItem[], id: string, edge: TimelineEdge, delta: number, minimum: number, duration: number) {
  return items.map((item) => {
    if (item.id !== id || item.kind !== "clip") return item;
    const end = item.start + item.duration;
    if (edge === "start") {
      const start = roundTime(clamp(item.start + delta, 0, end - minimum));
      return { ...item, start, duration: roundTime(end - start) };
    }
    return { ...item, duration: roundTime(clamp(item.duration + delta, minimum, duration - item.start)) };
  });
}

export function sameItems(a: TimelineItem[], b: TimelineItem[]) {
  return a.length === b.length && a.every((item, index) => {
    const other = b[index];
    return item.id === other.id && item.trackId === other.trackId && itemStart(item) === itemStart(other) && itemEnd(item) === itemEnd(other);
  });
}
