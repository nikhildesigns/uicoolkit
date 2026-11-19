"use client";

import { type ComponentPropsWithoutRef, createContext, useContext } from "react";
import type { MotionEasing, MotionRanges, MotionSpring, MotionSpringPhysics, MotionSpringTime, MotionValue } from "./motion-inspector-math";

/** Replaceable text, for example to translate. */
export type MotionInspectorMessages = {
  type: string;
  easing: string;
  spring: string;
  definedBy: string;
  preset: string;
  time: string;
  physics: string;
  duration: string;
  bounce: string;
  stiffness: string;
  damping: string;
  mass: string;
  delay: string;
  mixed: string;
  replay: string;
  springCurve: string;
  empty: string;
};

export const defaultMessages: MotionInspectorMessages = {
  type: "Animation",
  easing: "Easing",
  spring: "Spring",
  definedBy: "Type",
  preset: "Type",
  time: "Time",
  physics: "Physics",
  duration: "Duration",
  bounce: "Bounce",
  stiffness: "Stiffness",
  damping: "Damping",
  mass: "Mass",
  delay: "Delay",
  mixed: "Mixed",
  replay: "Replay",
  springCurve: "Spring curve",
  empty: "Select an item to edit its motion.",
};

/** What changed. */
export type MotionInspectorDetail = { field: "type" | "definedBy" | "curve" | "duration" | "delay" | "bounce" | "stiffness" | "damping" | "mass" };

/** Fields that can change together on the current value. */
export type MotionPatch = Partial<Omit<MotionEasing, "type"> & Omit<MotionSpringTime, "type" | "definedBy"> & Omit<MotionSpringPhysics, "type" | "definedBy">>;

export type MotionInspectorProps = Omit<ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue"> & {
  /** The committed transition, or null when nothing is selected. Your app owns it. Include `delay` to show the Delay field. */
  value: MotionValue | null;
  /** Called once per finished edit, for saving and undo. */
  onValueCommit: (value: MotionValue, detail: MotionInspectorDetail) => void;
  /** Called with live values while dragging, and with the committed value when a drag is cancelled. */
  onValueChange?: (value: MotionValue, detail: MotionInspectorDetail) => void;
  /** Called by Replay. Your app plays the transition. Passing it shows the button. */
  onReplay?: () => void;
  /** The panel's visible and accessible name, such as "Transition". */
  label: string;
  /** Selected items differ. Fields show Mixed, `value` is where editing starts, and the first edit commits a complete value. */
  mixed?: boolean;
  /** Limits, steps and units for the number fields. */
  ranges?: Partial<MotionRanges>;
  /** Where the preset menu and tooltip are portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  disabled?: boolean;
  readOnly?: boolean;
  messages?: Partial<MotionInspectorMessages>;
};

export type MotionInspectorContextValue = {
  /** The committed value. */
  value: MotionValue | null;
  /** The live value while editing, otherwise the committed value. */
  shown: MotionValue | null;
  label: string;
  mixed: boolean;
  disabled: boolean;
  readOnly: boolean;
  ranges: MotionRanges;
  container?: HTMLElement | null;
  messages: MotionInspectorMessages;
  onReplay?: () => void;
  preview: (patch: MotionPatch, field: MotionInspectorDetail["field"]) => void;
  commit: (patch: MotionPatch, field: MotionInspectorDetail["field"]) => void;
  chooseType: (type: MotionValue["type"]) => void;
  chooseDefinedBy: (definedBy: MotionSpring["definedBy"]) => void;
};

export const MotionInspectorContext = createContext<MotionInspectorContextValue | null>(null);

/** The value and state of the nearest MotionInspector, for custom parts. */
export function useMotionInspector() {
  const context = useContext(MotionInspectorContext);
  if (!context) throw new Error("Motion Inspector parts must be rendered inside <MotionInspector>.");
  return context;
}
