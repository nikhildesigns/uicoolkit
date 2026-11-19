/** A cubic Bézier easing: [x1, y1, x2, y2]. */
export type EasingCurveValue = readonly [number, number, number, number];
export type EasingCurveHandle = 0 | 1;
export type EasingCurvePoint = { x: number; y: number };
/** The lowest and highest progress the surface shows. */
export type EasingCurveRange = readonly [number, number];
export type EasingCurvePreset = { value: string; label: string; curve: EasingCurveValue };

/** One grid cell of six on each side, so the 0 to 1 area lands on grid lines and overshoot has room. */
export const defaultRange: EasingCurveRange = [-0.25, 1.25];
const plotInset = 1 / 6;

export const defaultPresets: EasingCurvePreset[] = [
  { value: "linear", label: "Linear", curve: [0, 0, 1, 1] },
  { value: "ease", label: "Ease", curve: [0.25, 0.1, 0.25, 1] },
  { value: "ease-in", label: "Ease in", curve: [0.42, 0, 1, 1] },
  { value: "ease-out", label: "Ease out", curve: [0, 0, 0.58, 1] },
  { value: "ease-in-out", label: "Ease in-out", curve: [0.42, 0, 0.58, 1] },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const decimals = (value: number) => (String(value).split(".")[1] ?? "").length;

export const xToRatio = (x: number) => plotInset + x * (1 - plotInset * 2);
export const ratioToX = (ratio: number) => (ratio - plotInset) / (1 - plotInset * 2);
export const yToRatio = (y: number, [min, max]: EasingCurveRange) => (max - y) / (max - min);
export const ratioToY = (ratio: number, [min, max]: EasingCurveRange) => max - ratio * (max - min);

export const handlePoint = (value: EasingCurveValue, handle: EasingCurveHandle): EasingCurvePoint => ({ x: value[handle * 2], y: value[handle * 2 + 1] });
export const sameCurve = (a: EasingCurveValue, b: EasingCurveValue) => a.every((coordinate, index) => coordinate === b[index]);

function snap(value: number, step: number) {
  return step > 0 ? Number((Math.round(value / step) * step).toFixed(decimals(step))) : value;
}

/** Moves one handle, keeping X from 0 to 1 and Y inside the range. */
export function moveHandle(value: EasingCurveValue, handle: EasingCurveHandle, point: EasingCurvePoint, range: EasingCurveRange = defaultRange, step = 0.01): EasingCurveValue {
  const x = clamp(snap(point.x, step), 0, 1);
  const y = clamp(snap(point.y, step), range[0], range[1]);
  return handle === 0 ? [x, y, value[2], value[3]] : [value[0], value[1], x, y];
}

const bezier = (a: number, b: number, t: number) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3;

/** The progress at a moment from 0 to 1. */
export function cubicBezierAt([x1, y1, x2, y2]: EasingCurveValue, time: number) {
  if (time <= 0) return 0;
  if (time >= 1) return 1;
  let low = 0;
  let high = 1;
  for (let index = 0; index < 32; index += 1) {
    const middle = (low + high) / 2;
    if (bezier(x1, x2, middle) < time) low = middle;
    else high = middle;
  }
  return bezier(y1, y2, (low + high) / 2);
}

export const formatCubicBezier = (value: EasingCurveValue) => `cubic-bezier(${value.join(", ")})`;

/** Reads cubic-bezier() or a CSS keyword. Returns null for anything else, including X outside 0 to 1. */
export function parseCubicBezier(text: string): EasingCurveValue | null {
  const source = text.trim().toLowerCase();
  const keyword = defaultPresets.find((preset) => preset.value === source);
  if (keyword) return keyword.curve;
  const match = /^cubic-bezier\(([^)]*)\)$/.exec(source);
  const parts = match?.[1].split(",").map((part) => (part.trim() === "" ? Number.NaN : Number(part)));
  if (parts?.length !== 4 || parts.some((part) => !Number.isFinite(part))) return null;
  const [x1, y1, x2, y2] = parts;
  return x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1 ? null : [x1, y1, x2, y2];
}

/** Reads typed text: four numbers, cubic-bezier() or a CSS keyword, with Y inside the range. */
export function parseCurveText(text: string, range: EasingCurveRange = defaultRange): EasingCurveValue | null {
  const source = text.trim();
  const curve = parseCubicBezier(source) ?? parseCubicBezier(`cubic-bezier(${source})`);
  if (!curve) return null;
  return [curve[1], curve[3]].every((y) => y >= range[0] && y <= range[1]) ? curve : null;
}

const toViewBox = (ratio: number) => Number((ratio * 100).toFixed(3));

/** An SVG path for the curve, in a 100 by 100 view box. */
export function curvePath(value: EasingCurveValue, range: EasingCurveRange) {
  const point = (x: number, y: number) => `${toViewBox(xToRatio(x))} ${toViewBox(yToRatio(y, range))}`;
  return `M ${point(0, 0)} C ${point(value[0], value[1])} ${point(value[2], value[3])} ${point(1, 1)}`;
}

/** An SVG path that samples any easing function, such as a spring. */
export function easingPath(easing: (time: number) => number, range: EasingCurveRange, samples = 64) {
  const count = Math.max(samples, 2);
  return Array.from({ length: count + 1 }, (_, index) => {
    const time = index / count;
    return `${index === 0 ? "M" : "L"} ${toViewBox(xToRatio(time))} ${toViewBox(yToRatio(easing(time), range))}`;
  }).join(" ");
}
