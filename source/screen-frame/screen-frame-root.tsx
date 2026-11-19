"use client";

import { forwardRef, useId, useState } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTarget } from "@/components/ui/context-menu";
import { type ScreenFrameContextValue, type ScreenFrameProps, ScreenFrameContext, defaultMessages } from "./screen-frame-state";
import { cn } from "@/lib/utils";

/**
 * One app screen on a design canvas: a name label above the screen's preview, like a frame on a
 * canvas, with a status and actions. The host owns the name, selection and persistence.
 */
export const ScreenFrame = forwardRef<HTMLDivElement, ScreenFrameProps>(function ScreenFrame(
  {
    name,
    onRename,
    validate,
    selected = false,
    onSelect,
    actions,
    disabled = false,
    motion = true,
    container,
    messages: messagesProp,
    className,
    children,
    ...props
  },
  ref,
) {
  const [renaming, setRenaming] = useState(false);
  const nameId = useId();
  const messages = { ...defaultMessages, ...messagesProp };
  const canRename = !!onRename && !disabled;
  const hasMenu = canRename || !!actions;

  const context: ScreenFrameContextValue = {
    name,
    selected,
    disabled,
    animated: motion,
    renaming,
    canRename,
    nameId,
    messages,
    container,
    onRename,
    validate,
    setRenaming: (next) => setRenaming(next && canRename),
    select: (details) => !disabled && onSelect?.(details),
  };

  const frame = (
    <div
      ref={ref}
      role="group"
      aria-labelledby={nameId}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      data-renaming={renaming || undefined}
      className={cn("group/frame grid w-full min-w-0 content-start gap-1.5 data-disabled:opacity-60", className)}
      {...props}
    >
      {children}
    </div>
  );

  return (
    <ScreenFrameContext.Provider value={context}>
      {hasMenu ? (
        // Renaming takes the keyboard and pointer, so the menu stays closed meanwhile.
        <ContextMenu disabled={disabled || renaming} motion={motion}>
          <ContextMenuTarget className="min-w-0">{frame}</ContextMenuTarget>
          <ContextMenuContent container={container}>
            {canRename && <ContextMenuItem onClick={() => setRenaming(true)}>{messages.rename}</ContextMenuItem>}
            {actions}
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        frame
      )}
    </ScreenFrameContext.Provider>
  );
});
