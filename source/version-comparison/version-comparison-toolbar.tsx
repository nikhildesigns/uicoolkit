"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { InspectorField, InspectorFieldLabel, InspectorFieldSegments, InspectorFieldSelect } from "@/components/ui/inspector-field";
import { type ComparisonMode, type ComparisonSlot, useVersionComparison } from "./version-comparison-state";
import { cn } from "@/lib/utils";

export const filledField = "[--uicoolkit-field-bg:color-mix(in_oklab,var(--foreground)_8%,transparent)] [--uicoolkit-field-border:transparent] [--uicoolkit-field-height:2.25rem] [--uicoolkit-field-shadow:none] pointer-coarse:[--uicoolkit-field-height:2.75rem]";

const icon = (path: string) => (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);
const modeIcons: Record<ComparisonMode, React.ReactNode> = {
  side: icon("M2.5 3.5h4.5v9H2.5ZM9 3.5h4.5v9H9Z"),
  swipe: icon("M2.5 3.5h11v9h-11ZM8 1.75v12.5"),
  overlay: icon("M2.5 2.5h8v8h-8ZM5.5 5.5h8v8h-8Z"),
};

function VersionSelect({ slot }: { slot: ComparisonSlot }) {
  const { versions, compare, renderVersion, container, disabled, messages, chooseSlot } = useVersionComparison();
  const renderOption = (option: { value: string }) => {
    const version = versions.find((item) => item.id === option.value);
    if (!version) return null;
    // The field shows only the name; the open menu adds a thumbnail and the Current label.
    return (
      <span className="inline-flex max-w-full min-w-0 items-center gap-2.5">
        <span aria-hidden className="relative h-9 w-12 shrink-0 overflow-hidden rounded-[4px] bg-foreground/8 in-[button]:hidden">
          {(version.status ?? "ready") === "ready" && renderVersion(version, { slot: null, size: "thumbnail" })}
        </span>
        <span className="min-w-0 truncate">{version.name}</span>
        {version.current && <span className="shrink-0 text-xs text-foreground/60 in-[button]:hidden">{messages.current}</span>}
      </span>
    );
  };
  return (
    <InspectorField label={slot === "a" ? messages.versionA : messages.versionB} labelPosition="inside" disabled={disabled} className={cn("min-w-0 flex-1", filledField)}>
      <InspectorFieldLabel />
      <InspectorFieldSelect value={compare[slot] ?? ""} options={versions.map((version) => ({ value: version.id, label: version.name }))} container={container} positionMethod={container ? "fixed" : undefined} itemClassName="py-1" renderOption={renderOption} onCommit={(id) => chooseSlot(slot, id)} />
    </InspectorField>
  );
}

/** The A and B selects, Swap and the comparison mode. */
export const VersionComparisonToolbar = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function VersionComparisonToolbar({ className, ...props }, ref) {
  const { versions, compare, mode, disabled, messages, setMode, swap } = useVersionComparison();
  return (
    // Two halves with the stage's gap, so Swap ends where the A pane ends in Side by side. Once the panes stack, A and B share the width equally.
    <div ref={ref} data-slot="version-comparison-toolbar" className={cn("grid min-w-0 grid-cols-2 items-center gap-2 @max-md/versions:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]", className)} {...props}>
      <div className="flex min-w-0 items-center gap-2 @max-md/versions:contents">
        <VersionSelect slot="a" />
        <button
          type="button"
          aria-label={messages.swap}
          title={messages.swap}
          disabled={disabled || versions.length < 2 || !compare.a || !compare.b}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground/8 text-foreground outline-none transition-colors hover:bg-foreground/15 focus-visible:bg-foreground/15 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none pointer-coarse:size-11 [&_svg]:size-4"
          onClick={swap}
        >
          {icon("M2.5 5.5h10M10 3l2.5 2.5L10 8M13.5 10.5h-10M6 8l-2.5 2.5L6 13")}
        </button>
      </div>
      <div className="flex min-w-0 items-center gap-2 @max-lg/versions:contents">
        <VersionSelect slot="b" />
        <InspectorField label={messages.mode} disabled={disabled} className={cn("block w-30 min-w-0 shrink-0 @max-lg/versions:col-span-full @max-lg/versions:w-auto", filledField)}>
          <InspectorFieldLabel className="sr-only" />
          <InspectorFieldSegments
            className="h-(--uicoolkit-field-height) w-full"
            value={mode}
            options={(["side", "swipe", "overlay"] as const).map((value) => ({ value, label: messages[value], icon: modeIcons[value] }))}
            onCommit={setMode}
          />
        </InspectorField>
      </div>
    </div>
  );
});
