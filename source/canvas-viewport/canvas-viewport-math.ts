/** Where the canvas sits: canvas point (x, y) shows at screen point (x * zoom + panX, y * zoom + panY). */
export type CanvasTransform = { panX: number; panY: number; zoom: number };
export type CanvasPoint = { x: number; y: number };
export type CanvasRect = CanvasPoint & { width: number; height: number };
export type CanvasZoomLimits = { minZoom?: number; maxZoom?: number };
export type CanvasFitOptions = CanvasZoomLimits & {
  /** Space kept around the content, in screen pixels. */
  padding?: number;
  /** The closest a fit may zoom in, so small content is not blown up. */
  maxFitZoom?: number;
};

export const defaultMinZoom = 0.1;
export const defaultMaxZoom = 4;

export function clampZoom(zoom: number, { minZoom = defaultMinZoom, maxZoom = defaultMaxZoom }: CanvasZoomLimits = {}) {
  return Math.min(maxZoom, Math.max(minZoom, zoom));
}

/** Zooms around a screen point, so whatever is under it stays under it. */
export function zoomAt(transform: CanvasTransform, nextZoom: number, point: CanvasPoint, limits?: CanvasZoomLimits): CanvasTransform {
  const zoom = clampZoom(nextZoom, limits);
  const ratio = zoom / transform.zoom;
  return { zoom, panX: point.x - (point.x - transform.panX) * ratio, panY: point.y - (point.y - transform.panY) * ratio };
}

/** The transform that shows every rect inside a viewport of the given size. */
export function fitRects(rects: CanvasRect[], viewport: { width: number; height: number }, { padding = 64, maxFitZoom = 1, ...limits }: CanvasFitOptions = {}): CanvasTransform {
  if (rects.length === 0 || viewport.width <= 0 || viewport.height <= 0) return { panX: 0, panY: 0, zoom: 1 };
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const width = Math.max(...rects.map((rect) => rect.x + rect.width)) - left;
  const height = Math.max(...rects.map((rect) => rect.y + rect.height)) - top;
  const zoom = clampZoom(Math.min(maxFitZoom, (viewport.width - padding * 2) / Math.max(1, width), (viewport.height - padding * 2) / Math.max(1, height)), limits);
  return { zoom, panX: (viewport.width - width * zoom) / 2 - left * zoom, panY: (viewport.height - height * zoom) / 2 - top * zoom };
}

/** A canvas rect in screen pixels, relative to the viewport. */
export const toScreenRect = (rect: CanvasRect, { panX, panY, zoom }: CanvasTransform): CanvasRect => ({
  x: rect.x * zoom + panX,
  y: rect.y * zoom + panY,
  width: rect.width * zoom,
  height: rect.height * zoom,
});

/** A screen point, relative to the viewport, in canvas units. */
export const toCanvasPoint = (point: CanvasPoint, { panX, panY, zoom }: CanvasTransform): CanvasPoint => ({ x: (point.x - panX) / zoom, y: (point.y - panY) / zoom });
