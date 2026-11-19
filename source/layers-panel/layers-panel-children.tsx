"use client";

import type { CSSProperties } from "react";
import { type LayersPanelLayer, useLayersPanel } from "./layers-panel-state";
import { cn } from "@/lib/utils";

/** Each level indents by this much: a child's icon lines up under its parent's name. */
const indent = 24;
/** The chevron's width plus the gap after it, where a row's icon starts. */
const chevronSlot = 20;
/** Where a row's content starts. */
export const inset = (depth: number) => 2 + depth * indent;
/** A flat list has no chevron column, so its rows start here. */
export const flatInset = 6;

/** Each child carries its own piece of the parent's guide; the last one stops, rounded, at its row's middle. */
export const guideClass = (last: boolean) =>
  cn("before:pointer-events-none before:absolute before:top-0 before:left-(--guide) before:w-px before:bg-muted-foreground/30", last ? "before:h-3.5 before:rounded-b-full" : "before:bottom-0");
/** The guide runs under the centre of the parent's chevron. */
export const guideStyle = (depth: number) => ({ "--guide": `${inset(depth - 1) + 8}px` }) as CSSProperties;

/** The row inside an open group while its children load, or after loading them failed. */
export function LayersPanelChildrenState({ layer, depth }: { layer: LayersPanelLayer; depth: number }) {
  const { messages, retryChildren, disabled } = useLayersPanel();
  const failed = layer.childrenStatus === "failed";
  return (
    <li className={cn("relative", guideClass(true))} style={guideStyle(depth)}>
      <div data-slot="children-state" data-state={layer.childrenStatus} className="flex h-7 items-center gap-2 pr-1 text-xs text-muted-foreground" style={{ paddingLeft: inset(depth) + chevronSlot }}>
        <span role="status">{failed ? messages.childrenFailed : messages.loadingChildren}</span>
        {failed && retryChildren && (
          <button
            type="button"
            disabled={disabled}
            aria-label={messages.retryChildren(layer.name)}
            onClick={() => retryChildren(layer)}
            className="rounded-sm font-medium text-foreground outline-none hover:underline focus-visible:underline disabled:opacity-50"
          >
            {messages.retry}
          </button>
        )}
      </div>
    </li>
  );
}
