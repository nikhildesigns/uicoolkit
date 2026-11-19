import type { EasingCurveValue } from "@/components/ui/easing-curve-editor";

export type MotionEasing = { type: "easing"; curve: EasingCurveValue; duration: number; delay?: number };
/** A spring set by how long it feels and how much it bounces. */
export type MotionSpringTime = { type: "spring"; definedBy: "time"; duration: number; bounce: number; delay?: number };
/** A spring set by its physical properties. */
export type MotionSpringPhysics = { type: "spring"; definedBy: "physics"; stiffness: number; damping: number; mass: number; delay?: number };
export type MotionSpring = MotionSpringTime | MotionSpringPhysics;
export type MotionValue = MotionEasing | MotionSpring;

export type MotionRange = { min: number; max: number; step: number; unit?: string };
export type MotionRanges = Record<"duration" | "delay" | "bounce" | "stiffness" | "damping" | "mass", MotionRange>;

export const defaultRanges: MotionRanges = {
  duration: { min: 0.05, max: 3, step: 0.01, unit: "s" },
  delay: { min: 0, max: 2, step: 0.01, unit: "s" },
  bounce: { min: -0.5, max: 0.9, step: 0.01 },
  stiffness: { min: 1, max: 1000, step: 1 },
  damping: { min: 1, max: 100, step: 0.1 },
  mass: { min: 0.1, max: 10, step: 0.1 },
};

const defaultCurve: EasingCurveValue = [0.25, 0.1, 0.25, 1];
const defaultBounce = 0.2;
const settleTolerance = 0.002;
const longestSettle = 10;
const framesPerSecond = 60;

function snap(value: number, { min, max, step }: MotionRange) {
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Math.min(max, Math.max(min, Number((Math.round(value / step) * step).toFixed(decimals))));
}

/** Physical properties for any spring. Duration is the natural period; bounce 0 is critically damped. */
export function springToPhysics(spring: MotionSpring, mass = 1): Omit<MotionSpringPhysics, "delay"> {
  if (spring.definedBy === "physics") return { type: "spring", definedBy: "physics", stiffness: spring.stiffness, damping: spring.damping, mass: spring.mass };
  const frequency = (2 * Math.PI) / spring.duration;
  const ratio = spring.bounce >= 0 ? 1 - spring.bounce : 1 / (1 + spring.bounce);
  return { type: "spring", definedBy: "physics", stiffness: mass * frequency * frequency, damping: 2 * ratio * mass * frequency, mass };
}

/** Duration and bounce for any spring. */
export function springToTime(spring: MotionSpring): Omit<MotionSpringTime, "delay"> {
  if (spring.definedBy === "time") return { type: "spring", definedBy: "time", duration: spring.duration, bounce: spring.bounce };
  const frequency = Math.sqrt(spring.stiffness / spring.mass);
  const ratio = spring.damping / (2 * Math.sqrt(spring.stiffness * spring.mass));
  return { type: "spring", definedBy: "time", duration: (2 * Math.PI) / frequency, bounce: ratio <= 1 ? 1 - ratio : 1 / ratio - 1 };
}

/** The progress of a spring moving from 0 to 1, at a time in seconds. */
export function springAt(spring: MotionSpring, seconds: number) {
  if (seconds <= 0) return 0;
  const { stiffness, damping, mass } = springToPhysics(spring);
  const frequency = Math.sqrt(stiffness / mass);
  const ratio = damping / (2 * Math.sqrt(stiffness * mass));
  if (Math.abs(ratio - 1) < 1e-6) return 1 - Math.exp(-frequency * seconds) * (1 + frequency * seconds);
  if (ratio < 1) {
    const damped = frequency * Math.sqrt(1 - ratio * ratio);
    return 1 - Math.exp(-ratio * frequency * seconds) * (Math.cos(damped * seconds) + ((ratio * frequency) / damped) * Math.sin(damped * seconds));
  }
  const spread = Math.sqrt(ratio * ratio - 1);
  const slow = -frequency * (ratio - spread);
  const fast = -frequency * (ratio + spread);
  return 1 - (fast * Math.exp(slow * seconds) - slow * Math.exp(fast * seconds)) / (fast - slow);
}

/** Seconds until a spring stays at its target, up to ten seconds. */
export function springSettleTime(spring: MotionSpring) {
  let last = 0;
  for (let frame = 1; frame <= longestSettle * framesPerSecond; frame += 1) {
    if (Math.abs(springAt(spring, frame / framesPerSecond) - 1) > settleTolerance) last = frame;
  }
  return Math.max(0.1, (last + 1) / framesPerSecond);
}

/** The furthest a spring travels past its target, as a share of the distance. */
export function springOvershoot(spring: MotionSpring) {
  const { stiffness, damping, mass } = springToPhysics(spring);
  const ratio = damping / (2 * Math.sqrt(stiffness * mass));
  return ratio >= 1 ? 0 : Math.exp((-Math.PI * ratio) / Math.sqrt(1 - ratio * ratio));
}

/** How long a value takes to finish, without its delay. */
export const motionDuration = (value: MotionValue) => (value.type === "easing" ? value.duration : springSettleTime(value));

const withDelay = <T extends MotionValue>(value: T, delay: number | undefined): T => {
  const { delay: _previous, ...rest } = value;
  void _previous;
  return (delay === undefined ? rest : { ...rest, delay }) as T;
};

/** Converts a spring between Time and Physics, keeping its shape as closely as the ranges allow. */
export function convertSpring(spring: MotionSpring, definedBy: MotionSpring["definedBy"], ranges: MotionRanges): MotionSpring {
  if (spring.definedBy === definedBy) return spring;
  if (definedBy === "time") {
    const time = springToTime(spring);
    return withDelay({ ...time, duration: snap(time.duration, ranges.duration), bounce: snap(time.bounce, ranges.bounce) }, spring.delay);
  }
  const physics = springToPhysics(spring);
  return withDelay({ ...physics, stiffness: snap(physics.stiffness, ranges.stiffness), damping: snap(physics.damping, ranges.damping), mass: snap(physics.mass, ranges.mass) }, spring.delay);
}

/** The value for another mode: what it last held, or a start based on the current timing. */
export function switchType(value: MotionValue, type: MotionValue["type"], remembered: { easing?: MotionEasing; spring?: MotionSpring }, ranges: MotionRanges): MotionValue {
  if (value.type === type) return value;
  if (value.type === "easing") {
    return withDelay<MotionSpring>(remembered.spring ?? { type: "spring", definedBy: "time", duration: snap(value.duration, ranges.duration), bounce: defaultBounce }, value.delay);
  }
  return withDelay<MotionEasing>(remembered.easing ?? { type: "easing", curve: defaultCurve, duration: snap(springToTime(value).duration, ranges.duration) }, value.delay);
}
