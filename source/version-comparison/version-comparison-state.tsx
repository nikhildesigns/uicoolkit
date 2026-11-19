"use client";

import { type ComponentPropsWithoutRef, type ReactNode, createContext, useContext, useEffect, useLayoutEffect } from "react";

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type ComparisonVersion = {
  id: string;
  name: string;
  /** The version in use now. It gets the Current label and is what the strip compares against. */
  current?: boolean;
  status?: "ready" | "loading" | "error";
};
export type ComparisonChange = { label: string; before: string; after: string };
export type ComparisonMode = "side" | "swipe" | "overlay";
export type ComparisonSlot = "a" | "b";
export type ComparisonPair = { a: string | null; b: string | null };
export type ComparisonRenderDetail = { slot: ComparisonSlot | null; size: "stage" | "thumbnail" };

/** Replaceable text, for example to translate. */
export type VersionComparisonMessages = {
  versionA: string;
  versionB: string;
  swap: string;
  mode: string;
  side: string;
  swipe: string;
  overlay: string;
  divider: string;
  opacity: string;
  current: string;
  changes: string;
  versions: string;
  actions: (name: string) => string;
  compare: (name: string) => string;
  use: (name: string) => string;
  useShort: string;
  name: string;
  rename: string;
  duplicate: string;
  delete: string;
  loading: string;
  failed: string;
  retry: string;
  needTwo: string;
};

export const defaultMessages: VersionComparisonMessages = {
  versionA: "A",
  versionB: "B",
  swap: "Swap versions",
  mode: "Comparison mode",
  side: "Side by side",
  swipe: "Swipe",
  overlay: "Overlay",
  divider: "Comparison divider",
  opacity: "B opacity",
  current: "Current",
  changes: "Changes",
  versions: "Versions",
  actions: (name) => `${name} actions`,
  compare: (name) => `Compare ${name}`,
  use: (name) => `Use ${name}`,
  useShort: "Use",
  name: "Version name",
  rename: "Rename",
  duplicate: "Duplicate",
  delete: "Delete",
  loading: "Loading version",
  failed: "This version could not load.",
  retry: "Retry",
  needTwo: "Add another version to compare.",
};

export type VersionComparisonProps = Omit<ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue"> & {
  /** Names the panel for screen readers. */
  label: string;
  /** The alternatives. Your app owns them. */
  versions: ComparisonVersion[];
  /** The versions being compared. Your app owns them. */
  compare: ComparisonPair;
  onCompareChange: (pair: ComparisonPair) => void;
  /** Draws a version for the stage or the strip. It can return an image, a screen or live UI. */
  renderVersion: (version: ComparisonVersion, detail: ComparisonRenderDetail) => ReactNode;
  /** What differs between A and B, if your app knows. Passing it shows the list. */
  changes?: ComparisonChange[];
  /** Passing it shows a Use button on each version that can be chosen. Your app applies the version. */
  onUse?: (id: string) => void;
  /** Passing it lets people rename versions. Return a promise to show saving. */
  onRename?: (id: string, name: string) => void | Promise<unknown>;
  /** Passing it adds Duplicate to the menu. */
  onDuplicate?: (id: string) => void;
  /** Passing it adds Delete to the menu. The current version cannot be deleted. */
  onDelete?: (id: string) => void;
  /** Passing it offers Retry on a version that failed to load. */
  onRetry?: (id: string) => void;
  /** The starting mode. Phones start on Swipe, other screens on Side by side. */
  defaultMode?: ComparisonMode;
  /** Called with live divider positions from 0 to 1, and the start when a drag is cancelled. */
  onDividerChange?: (position: number) => void;
  onDividerCommit?: (position: number) => void;
  /** Called with live overlay opacity from 0 to 1, and the committed value when a drag is cancelled. */
  onOpacityChange?: (opacity: number) => void;
  onOpacityCommit?: (opacity: number) => void;
  /** The stage's shape as a CSS aspect ratio. */
  aspectRatio?: string;
  /** Where menus are portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  disabled?: boolean;
  messages?: Partial<VersionComparisonMessages>;
};

export type VersionComparisonContextValue = Pick<VersionComparisonProps, "versions" | "compare" | "renderVersion" | "changes" | "onUse" | "onRename" | "onDuplicate" | "onDelete" | "onRetry" | "onDividerChange" | "onDividerCommit" | "onOpacityChange" | "onOpacityCommit" | "container"> & {
  versionA: ComparisonVersion | null;
  versionB: ComparisonVersion | null;
  mode: ComparisonMode;
  divider: number;
  opacity: number;
  aspectRatio: string;
  disabled: boolean;
  renamingId: string | null;
  messages: VersionComparisonMessages;
  setMode: (mode: ComparisonMode) => void;
  setDivider: (position: number) => void;
  setOpacity: (opacity: number) => void;
  setRenamingId: (id: string | null) => void;
  chooseSlot: (slot: ComparisonSlot, id: string) => void;
  swap: () => void;
};

export const VersionComparisonContext = createContext<VersionComparisonContextValue | null>(null);

/** The compared versions and view state of the nearest VersionComparison, for custom parts. */
export function useVersionComparison() {
  const context = useContext(VersionComparisonContext);
  if (!context) throw new Error("Version Comparison parts must be rendered inside <VersionComparison>.");
  return context;
}
