"use client";

import { forwardRef, useState, useSyncExternalStore } from "react";
import { VersionComparisonChanges, VersionComparisonOpacity, VersionComparisonStage } from "./version-comparison-stage";
import { VersionComparisonToolbar } from "./version-comparison-toolbar";
import { type ComparisonMode, type ComparisonSlot, type VersionComparisonProps, VersionComparisonContext, defaultMessages } from "./version-comparison-state";
import { cn } from "@/lib/utils";

const phoneQuery = "(max-width: 639px)";
const subscribePhone = (listener: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(phoneQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};
const readPhone = () => (typeof window.matchMedia === "function" ? window.matchMedia(phoneQuery).matches : false);

/** Puts two design versions next to each other. Your app owns the versions and applies the choice. */
export const VersionComparison = forwardRef<HTMLDivElement, VersionComparisonProps>(function VersionComparison(
  {
    label,
    versions,
    compare,
    onCompareChange,
    renderVersion,
    changes,
    onUse,
    onRename,
    onDuplicate,
    onDelete,
    onRetry,
    defaultMode,
    onDividerChange,
    onDividerCommit,
    onOpacityChange,
    onOpacityCommit,
    aspectRatio = "16 / 10",
    container,
    disabled = false,
    messages: messageOverrides,
    className,
    children,
    ...props
  },
  ref,
) {
  const messages = { ...defaultMessages, ...messageOverrides };
  const phone = useSyncExternalStore(subscribePhone, readPhone, () => false);
  const [chosenMode, setMode] = useState<ComparisonMode | null>(defaultMode ?? null);
  const [divider, setDivider] = useState(0.5);
  const [opacity, setOpacity] = useState(0.5);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const find = (id: string | null) => versions.find((version) => version.id === id) ?? null;
  const { a, b } = compare;

  const chooseSlot = (slot: ComparisonSlot, id: string) => {
    if (id === (slot === "a" ? a : b)) return;
    if (id === (slot === "a" ? b : a)) onCompareChange({ a: b, b: a });
    else onCompareChange(slot === "a" ? { a: id, b } : { a, b: id });
  };

  return (
    <VersionComparisonContext.Provider
      value={{
        versions,
        compare,
        renderVersion,
        changes,
        onUse,
        onRename,
        onDuplicate,
        onDelete,
        onRetry,
        onDividerChange,
        onDividerCommit,
        onOpacityChange,
        onOpacityCommit,
        container,
        versionA: find(a),
        versionB: find(b),
        mode: chosenMode ?? (phone ? "swipe" : "side"),
        divider,
        opacity,
        aspectRatio,
        disabled,
        renamingId,
        messages,
        setMode,
        setDivider,
        setOpacity,
        setRenamingId,
        chooseSlot,
        swap: () => onCompareChange({ a: b, b: a }),
      }}
    >
      <div ref={ref} role="group" aria-label={label} data-slot="version-comparison" data-disabled={disabled ? "" : undefined} className={cn("@container/versions grid w-full min-w-0 content-start gap-3 text-sm", className)} {...props}>
        {children ?? (
          <>
            <VersionComparisonToolbar />
            <VersionComparisonStage />
            <VersionComparisonOpacity />
            <VersionComparisonChanges />
          </>
        )}
      </div>
    </VersionComparisonContext.Provider>
  );
});
