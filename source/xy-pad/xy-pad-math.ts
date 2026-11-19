export type XYPadAxisName = "x" | "y";

/** Null means the axis has no single value, such as a mixed selection. */
export type XYPadValue = { x: number | null; y: number | null };
export type XYPadRatio = { x: number; y: number };
export type XYPadDirection = "down" | "up";

export type XYPadAxis = {
  /** Names the axis, such as "Offset X". */
  label: string;
  /** A shorter name for its field, such as "X". */
  shortLabel?: string;
  min: number;
  max: number;
  step?: number;
  /** Used with Shift. Defaults to ten steps. */
  largeStep?: number;
  /** Decimal places kept. Defaults to the decimals of `step`. */
  precision?: number;
  /** Shown after the value, such as "px" or "%". */
  unit?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const decimals = (value: number) => (String(value).split(".")[1] ?? "").length;

export const axisStep = (axis: XYPadAxis) => (axis.step && axis.step > 0 ? axis.step : 1);
export const axisLargeStep = (axis: XYPadAxis) => axis.largeStep ?? axisStep(axis) * 10;
export const axisPrecision = (axis: XYPadAxis) => axis.precision ?? decimals(axisStep(axis));
export const axisMiddle = (axis: XYPadAxis) => snapToAxis((axis.min + axis.max) / 2, axis);

/** Keeps a value inside the axis and on its steps, counted from the minimum. */
export function snapToAxis(value: number, axis: XYPadAxis) {
  const step = axisStep(axis);
  const snapped = axis.min + Math.round((clamp(value, axis.min, axis.max) - axis.min) / step) * step;
  return Number(clamp(snapped, axis.min, axis.max).toFixed(axisPrecision(axis)));
}

/** How far along the axis a value sits, from 0 to 1. */
export function axisRatio(value: number, axis: XYPadAxis) {
  return axis.max === axis.min ? 0 : clamp((value - axis.min) / (axis.max - axis.min), 0, 1);
}

/** Where a value sits on the surface, from the top-left corner. An axis without a value sits in the middle. */
export function valueToRatio(value: XYPadValue, xAxis: XYPadAxis, yAxis: XYPadAxis, direction: XYPadDirection): XYPadRatio {
  const y = value.y === null ? 0.5 : axisRatio(value.y, yAxis);
  return { x: value.x === null ? 0.5 : axisRatio(value.x, xAxis), y: direction === "up" ? 1 - y : y };
}

/** The value at a place on the surface, measured from the top-left corner. */
export function ratioToValue(ratio: XYPadRatio, xAxis: XYPadAxis, yAxis: XYPadAxis, direction: XYPadDirection) {
  const y = direction === "up" ? 1 - ratio.y : ratio.y;
  return {
    x: snapToAxis(xAxis.min + ratio.x * (xAxis.max - xAxis.min), xAxis),
    y: snapToAxis(yAxis.min + y * (yAxis.max - yAxis.min), yAxis),
  };
}

export const sameValue = (a: XYPadValue, b: XYPadValue) => a.x === b.x && a.y === b.y;

export function changedAxes(from: XYPadValue, to: XYPadValue) {
  return (["x", "y"] as const).filter((axis) => from[axis] !== to[axis]);
}

/** Zero when it falls inside the axis, otherwise the middle of the axis. */
export const axisOrigin = (axis: XYPadAxis) => (axis.min < 0 && axis.max > 0 ? 0 : (axis.min + axis.max) / 2);
