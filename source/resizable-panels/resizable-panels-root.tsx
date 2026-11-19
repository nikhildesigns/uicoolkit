"use client";

import { forwardRef, useCallback, useContext, useId, useImperativeHandle, useMemo, useRef, useState, version } from "react";
import {
  type ResizablePanelContextValue,
  type ResizablePanelProps,
  type ResizablePanelsProps,
  ResizablePanelContext,
  ResizablePanelsContext,
  availableSize,
  clampSize,
  useIsomorphicLayoutEffect,
  useResizablePanels,
} from "./resizable-panels-state";
import { cn } from "@/lib/utils";

/** Panels in a row or stack. Give a panel a size to make it resizable; a panel without one fills what is left. */
export const ResizablePanels = forwardRef<HTMLDivElement, ResizablePanelsProps>(function ResizablePanels(
  { direction = "horizontal", minFillSize = 0, disabled = false, motion = true, className, ...props },
  ref,
) {
  const context = useMemo(() => ({ direction, minFillSize, disabled, animated: motion }), [direction, minFillSize, disabled, motion]);
  return (
    <ResizablePanelsContext.Provider value={context}>
      <div ref={ref} data-slot="resizable-panels" data-direction={direction} className={cn("flex size-full min-h-0 min-w-0 overflow-hidden", direction === "vertical" && "flex-col", className)} {...props} />
    </ResizablePanelsContext.Provider>
  );
});

/** One panel. Put a ResizableHandle inside it to resize it from that edge. */
export const ResizablePanel = forwardRef<HTMLDivElement, ResizablePanelProps>(function ResizablePanel(
  { size: sizeProp, defaultSize, minSize = 0, maxSize = Infinity, collapsed = false, onSizeChange, onSizeCommit, onResizingChange, id, className, style, children, ...props },
  ref,
) {
  const group = useResizablePanels();
  const { direction, minFillSize, animated } = group;
  const generatedId = useId();
  const panelId = id ?? generatedId;
  const element = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => element.current as HTMLDivElement);
  const sized = sizeProp !== undefined || defaultSize !== undefined;
  const [inner, setInner] = useState(defaultSize ?? 0);
  const [available, setAvailable] = useState(Infinity);
  const [resizing, setResizingState] = useState(false);
  const stored = sizeProp ?? inner;
  const max = Math.max(minSize, Math.min(maxSize, available));
  // The stored size is kept, so a panel squeezed by a small window returns to it when there is room.
  const size = clampSize(stored, minSize, max);
  const horizontal = direction === "horizontal";

  useIsomorphicLayoutEffect(() => {
    const panel = element.current;
    // Found from the DOM: a parent's ref is not attached yet when this first runs.
    const root = panel?.closest<HTMLElement>("[data-slot=resizable-panels]");
    if (!sized || !panel || !root) return;
    const measure = () => setAvailable(availableSize(panel, root, direction, minFillSize));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const child of root.children) if (child !== panel) observer.observe(child);
    return () => observer.disconnect();
  }, [sized, direction, minFillSize]);

  const latest = useRef({ controlled: sizeProp !== undefined, onSizeChange, onSizeCommit, onResizingChange });
  useIsomorphicLayoutEffect(() => {
    latest.current = { controlled: sizeProp !== undefined, onSizeChange, onSizeCommit, onResizingChange };
  });
  const setSize = useCallback((next: number) => {
    if (!latest.current.controlled) setInner(next);
    latest.current.onSizeChange?.(next);
  }, []);
  const commit = useCallback((next: number) => latest.current.onSizeCommit?.(next), []);
  const setResizing = useCallback((next: boolean) => {
    setResizingState(next);
    latest.current.onResizingChange?.(next);
  }, []);

  const context: ResizablePanelContextValue = { panelId, size, min: minSize, max, collapsed, resizing, setSize, commit, setResizing };
  const shown = collapsed ? 0 : size;
  // React 18 forwards inert as a string attribute. React 19 treats it as a boolean.
  const inertProps = collapsed ? { inert: version.startsWith("18.") ? "" as unknown as boolean : true, "aria-hidden": true } : {};

  return (
    <ResizablePanelContext.Provider value={context}>
      <div
        ref={element}
        id={panelId}
        data-slot="resizable-panel"
        data-sized={sized || undefined}
        data-collapsed={collapsed || undefined}
        data-resizing={resizing || undefined}
        className={cn(
          "relative min-h-0 min-w-0",
          sized ? "shrink-0" : "flex-1",
          collapsed && "overflow-hidden",
          sized && animated && !resizing && (horizontal ? "transition-[width] duration-200 ease-out motion-reduce:transition-none" : "transition-[height] duration-200 ease-out motion-reduce:transition-none"),
          className,
        )}
        style={sized ? { ...style, [horizontal ? "width" : "height"]: shown } : style}
        {...inertProps}
        {...props}
      >
        {children}
      </div>
    </ResizablePanelContext.Provider>
  );
});

export function useResizablePanel() {
  const context = useContext(ResizablePanelContext);
  if (!context) throw new Error("ResizableHandle must be rendered inside <ResizablePanel>.");
  return context;
}
