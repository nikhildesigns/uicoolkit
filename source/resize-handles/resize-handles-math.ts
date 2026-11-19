export type ResizeRect = { x: number; y: number; width: number; height: number };
export type ResizePoint = { x: number; y: number };
export type ResizeHandleName = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

/** The dragged edges, in the rect's units. An axis the handle does not move is left out. */
export type ResizeEdges = { x?: number; y?: number };
export type ResizeSnap = (edges: ResizeEdges, handle: ResizeHandleName) => ResizeEdges;

export type ResizeLimits = {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
};

export type ResizeOptions = ResizeLimits & {
  /** Keeps width divided by height at this value. */
  aspectRatio?: number;
  /** Grows both sides equally, so the centre stays put. */
  fromCenter?: boolean;
  /** Places dragged edges on multiples of this value. */
  step?: number;
  /** Moves dragged edges, for example to your alignment guides. Limits still apply afterwards. */
  snap?: ResizeSnap;
};

export const cornerHandles: ResizeHandleName[] = ["nw", "ne", "se", "sw"];
export const edgeHandles: ResizeHandleName[] = ["n", "e", "s", "w"];

/** Which way each handle moves: x is -1 left, 1 right; y is -1 up, 1 down. */
export const handleAxes: Record<ResizeHandleName, readonly [number, number]> = {
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
  nw: [-1, -1],
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

export const sameRect = (a: ResizeRect, b: ResizeRect) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

export function resolveHandles(handles: "all" | "corners" | "edges" | ResizeHandleName[]) {
  if (handles === "all") return [...cornerHandles, ...edgeHandles];
  if (handles === "corners") return cornerHandles;
  if (handles === "edges") return edgeHandles;
  return handles;
}

/** The rect after moving a handle by `delta`. It never flips: past the opposite edge it stops at the minimum size. */
export function resizeRect(start: ResizeRect, handle: ResizeHandleName, delta: ResizePoint, options: ResizeOptions = {}): ResizeRect {
  const { minWidth = 1, minHeight = 1, maxWidth = Infinity, maxHeight = Infinity, aspectRatio, fromCenter = false, step, snap } = options;
  const [dirX, dirY] = handleAxes[handle];
  const right = start.x + start.width;
  const bottom = start.y + start.height;
  const centerX = start.x + start.width / 2;
  const centerY = start.y + start.height / 2;
  const onGrid = (value: number) => (step && step > 0 ? Math.round(value / step) * step : value);

  let edges: ResizeEdges = {
    x: dirX ? onGrid((dirX > 0 ? right : start.x) + delta.x) : undefined,
    y: dirY ? onGrid((dirY > 0 ? bottom : start.y) + delta.y) : undefined,
  };
  if (snap) {
    const snapped = snap(edges, handle);
    edges = { x: dirX ? (snapped.x ?? edges.x) : undefined, y: dirY ? (snapped.y ?? edges.y) : undefined };
  }

  const span = (edge: number, dir: number, low: number, high: number, center: number) => (fromCenter ? dir * (edge - center) * 2 : dir * (edge - (dir > 0 ? low : high)));
  let width = edges.x === undefined ? start.width : span(edges.x, dirX, start.x, right, centerX);
  let height = edges.y === undefined ? start.height : span(edges.y, dirY, start.y, bottom, centerY);

  if (aspectRatio && aspectRatio > 0) {
    const change = (value: number, from: number) => (from > 0 ? Math.abs(value / from - 1) : 0);
    // A corner follows whichever axis moved furthest; an edge follows its own axis.
    const widthLeads = dirY === 0 || (dirX !== 0 && change(width, start.width) >= change(height, start.height));
    width = clamp(widthLeads ? width : height * aspectRatio, Math.max(minWidth, minHeight * aspectRatio), Math.min(maxWidth, maxHeight * aspectRatio));
    height = width / aspectRatio;
  } else {
    width = clamp(width, minWidth, maxWidth);
    height = clamp(height, minHeight, maxHeight);
  }

  const place = (dir: number, low: number, high: number, center: number, size: number) => {
    if (fromCenter || dir === 0) return center - size / 2;
    return dir > 0 ? low : high - size;
  };
  return { x: place(dirX, start.x, right, centerX, width), y: place(dirY, start.y, bottom, centerY, height), width, height };
}
