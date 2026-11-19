"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { InlineEdit, InlineEditEditor, InlineEditError, InlineEditInput, InlineEditPreview } from "@/components/ui/inline-edit";
import { useScreenFrame } from "./screen-frame-state";
import { cn } from "@/lib/utils";

/** The label row above the preview, like a frame's name on a canvas: name, then status at the right edge. */
export const ScreenFrameHeader = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function ScreenFrameHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn("flex min-h-7 min-w-0 items-center gap-1.5", className)} {...props} />;
});

/**
 * The screen's name. A click selects the screen; double click or F2 renames it in place
 * (Inline Edit's ghost variant without its underline: the frame below already frames it).
 * Enter or leaving saves, Escape cancels.
 */
export const ScreenFrameName = forwardRef<HTMLDivElement, { className?: string }>(function ScreenFrameName({ className }, ref) {
  const frame = useScreenFrame();
  const text = cn("text-xs font-medium text-muted-foreground group-data-selected/frame:text-foreground", className);
  if (!frame.onRename)
    return (
      <div ref={ref} id={frame.nameId} className={cn("min-w-0 flex-1 truncate px-1", text)}>
        {frame.name}
      </div>
    );
  return (
    <InlineEdit
      ref={ref}
      label={frame.messages.nameLabel}
      value={frame.name}
      onSave={frame.onRename}
      validate={frame.validate}
      editing={frame.renaming}
      onEditingChange={frame.setRenaming}
      disabled={frame.disabled}
      motion={frame.animated}
      variant="ghost"
      className="min-w-0 flex-1"
    >
      <InlineEditPreview
        id={frame.nameId}
        className={cn("h-7 min-h-7 w-full truncate after:hidden", text)}
        // One click selects the screen, as on a canvas; renaming takes a double click or F2.
        onClick={(event) => {
          event.preventDefault();
          frame.select({ additive: event.metaKey || event.ctrlKey, range: event.shiftKey });
        }}
        onDoubleClick={() => frame.setRenaming(true)}
        onKeyDown={(event) => {
          if (event.key !== "F2") return;
          event.preventDefault();
          frame.setRenaming(true);
        }}
      />
      <InlineEditEditor className="after:hidden">
        <InlineEditInput className={cn("h-7 text-xs font-medium", className)} />
      </InlineEditEditor>
      <InlineEditError className="px-1 text-xs" />
    </InlineEdit>
  );
});
