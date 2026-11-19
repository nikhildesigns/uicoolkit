"use client";

import { type ComponentPropsWithoutRef, type CSSProperties, type ReactNode, forwardRef, useRef } from "react";
import { NumberField, NumberFieldLabel, NumberFieldSlider, NumberFieldSliderFill, NumberFieldSliderThumb, NumberFieldValue } from "@/components/ui/number-field";
import { VersionComparisonDivider } from "./version-comparison-divider";
import { VersionComparisonLabel } from "./version-comparison-label";
import { type ComparisonSlot, type ComparisonVersion, useVersionComparison } from "./version-comparison-state";
import { cn } from "@/lib/utils";

function UseButton({ version, align = "right", top = false }: { version: ComparisonVersion | null; align?: "left" | "right"; top?: boolean }) {
  const { disabled, messages, onUse } = useVersionComparison();
  if (!onUse || !version || version.current || (version.status ?? "ready") !== "ready") return null;
  return (
    <button
      type="button"
      aria-label={messages.use(version.name)}
      disabled={disabled}
      className={cn("absolute z-[3] h-7 rounded-[5px] bg-primary px-2.5 text-xs font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none pointer-coarse:h-11 pointer-coarse:px-4", top ? "top-1.5 h-6 px-2" : "bottom-2", align === "left" ? "left-2" : "right-2")}
      onClick={() => onUse(version.id)}
    >
      {messages.useShort}
    </button>
  );
}

function Pane({ version, slot, align = "left", className, style, children }: { version: ComparisonVersion | null; slot: ComparisonSlot; align?: "left" | "right"; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const { renderVersion, onRetry, disabled, messages } = useVersionComparison();
  const status = version?.status ?? "ready";
  const letter = slot === "a" ? messages.versionA : messages.versionB;
  return (
    <div role="group" aria-label={version ? `${letter}: ${version.name}` : letter} aria-busy={status === "loading" || undefined} data-slot="version-comparison-pane" data-version-slot={slot} className={cn("overflow-hidden rounded-md bg-foreground/5", className)} style={style}>
      <div className="absolute inset-0 grid place-items-center">
        {version && status === "ready" && renderVersion(version, { slot, size: "stage" })}
        {status === "loading" && <span role="status" aria-label={messages.loading} className="size-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground motion-reduce:animate-none" />}
        {status === "error" && (
          <span className="grid justify-items-center gap-2 px-4 text-center text-muted-foreground">
            {messages.failed}
            {onRetry && version && (
              <button type="button" disabled={disabled} className="h-9 rounded-md bg-foreground/8 px-3 text-foreground outline-none hover:bg-foreground/15 focus-visible:bg-foreground/15 disabled:opacity-40 pointer-coarse:h-11" onClick={() => onRetry(version.id)}>
                {messages.retry}
              </button>
            )}
          </span>
        )}
      </div>
      {version && <VersionComparisonLabel version={version} slot={slot} align={align} />}
      {children}
    </div>
  );
}

/** The two versions, drawn for the current mode. */
export const VersionComparisonStage = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function VersionComparisonStage({ className, style, ...props }, ref) {
  const { versions, versionA, versionB, mode, divider, opacity, aspectRatio, messages } = useVersionComparison();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const ratio = { aspectRatio };
  if (versions.length < 2) {
    return (
      <div ref={ref} data-slot="version-comparison-empty" className={cn("grid place-items-center rounded-md bg-foreground/5 px-4 text-center text-muted-foreground", className)} style={{ ...ratio, ...style }} {...props}>
        {messages.needTwo}
      </div>
    );
  }
  if (mode === "side") {
    return (
      <div ref={ref} data-slot="version-comparison-stage" data-mode={mode} className={cn("grid min-w-0 grid-cols-2 gap-2 @max-md/versions:grid-cols-1", className)} style={style} {...props}>
        <Pane version={versionA} slot="a" className="relative" style={ratio}>
          <UseButton version={versionA} top />
        </Pane>
        <Pane version={versionB} slot="b" className="relative" style={ratio}>
          <UseButton version={versionB} top />
        </Pane>
      </div>
    );
  }
  const top: CSSProperties = mode === "swipe" ? { clipPath: `inset(0 0 0 ${divider * 100}%)` } : { opacity };
  return (
    <div
      ref={(node) => {
        stageRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-slot="version-comparison-stage"
      data-mode={mode}
      className={cn("relative min-w-0 overflow-hidden rounded-md select-none", className)}
      style={{ ...ratio, ...style }}
      {...props}
    >
      <Pane version={versionA} slot="a" className="absolute inset-0" />
      <Pane version={versionB} slot="b" align="right" className="absolute inset-0" style={top} />
      {mode === "swipe" && <VersionComparisonDivider stageRef={stageRef} />}
      {/* Outside the panes, so moving the divider never clips them. */}
      <UseButton version={versionA} align="left" />
      <UseButton version={versionB} />
    </div>
  );
});

/** How strongly B shows over A. It appears in Overlay mode. */
export const VersionComparisonOpacity = forwardRef<HTMLDivElement, Omit<ComponentPropsWithoutRef<"div">, "children" | "defaultValue">>(function VersionComparisonOpacity({ className, ...props }, ref) {
  const { versions, mode, opacity, disabled, messages, setOpacity, onOpacityChange, onOpacityCommit } = useVersionComparison();
  if (versions.length < 2 || mode !== "overlay") return null;
  return (
    <NumberField
      ref={ref}
      data-slot="version-comparison-opacity"
      label={messages.opacity}
      value={Math.round(opacity * 100)}
      min={0}
      max={100}
      step={1}
      unit="%"
      disabled={disabled}
      className={cn("min-w-0", className)}
      onValueChange={(next) => {
        setOpacity(next / 100);
        onOpacityChange?.(next / 100);
      }}
      onValueCommit={(next) => {
        setOpacity(next / 100);
        onOpacityCommit?.(next / 100);
      }}
      {...props}
    >
      <NumberFieldSlider className="h-9 pointer-coarse:h-11">
        <NumberFieldSliderFill />
        <NumberFieldSliderThumb />
        <NumberFieldLabel />
        <NumberFieldValue />
      </NumberFieldSlider>
    </NumberField>
  );
});

/** What differs between A and B, one row per property. It shows when your app passes changes. */
export const VersionComparisonChanges = forwardRef<HTMLDListElement, ComponentPropsWithoutRef<"dl">>(function VersionComparisonChanges({ className, ...props }, ref) {
  const { changes, messages } = useVersionComparison();
  if (!changes?.length) return null;
  return (
    <dl ref={ref} aria-label={messages.changes} data-slot="version-comparison-changes" className={cn("grid min-w-0 gap-1", className)} {...props}>
      {changes.map((change) => (
        <div key={change.label} className="flex h-9 min-w-0 items-center justify-between gap-3 rounded-md bg-foreground/8 px-2.5 pointer-coarse:h-11">
          <dt className="min-w-0 truncate text-foreground/80">{change.label}</dt>
          <dd className="flex min-w-0 shrink-0 items-center gap-1.5 font-mono text-xs text-foreground tabular-nums">
            <span className="truncate text-foreground/60">{change.before}</span>
            <span aria-hidden className="text-foreground/50">→</span>
            <span className="sr-only">to</span>
            <span className="truncate">{change.after}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
});
