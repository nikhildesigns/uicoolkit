"use client";

import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";
import { type InlineEditStatus, useInlineEdit, type InlineEditFailure, enter } from "./inline-edit-state";
import { cn } from "@/lib/utils";

export const buttonBase =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-1 focus-visible:ring-ring aria-disabled:opacity-60";

export type ActionProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  children?: ReactNode | ((status: InlineEditStatus) => ReactNode);
};

/** Submits the draft. Stays focusable while pending so focus is not lost. */
export const InlineEditSave = forwardRef<HTMLButtonElement, ActionProps>(function InlineEditSave({ children, className, ...props }, ref) {
  const { status, conflict } = useInlineEdit();
  const unavailable = status === "pending" || conflict;
  const fallback = status === "pending" ? "Saving…" : status === "error" ? "Retry" : "Save";
  return (
    <button
      ref={ref}
      type="submit"
      aria-disabled={unavailable || undefined}
      aria-busy={status === "pending" || undefined}
      className={cn(buttonBase, "bg-primary text-primary-foreground hover:bg-primary/90", className)}
      {...props}
    >
      {typeof children === "function" ? children(status) : children ?? fallback}
    </button>
  );
});

export const InlineEditCancel = forwardRef<HTMLButtonElement, ActionProps>(function InlineEditCancel(
  { children, className, onClick, ...props },
  ref,
) {
  const { status, cancel } = useInlineEdit();
  return (
    <button
      ref={ref}
      type="button"
      aria-disabled={status === "pending" || undefined}
      className={cn(buttonBase, "hover:bg-accent hover:text-accent-foreground", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) cancel();
      }}
      {...props}
    >
      {typeof children === "function" ? children(status) : children ?? "Cancel"}
    </button>
  );
});

export type InlineEditErrorProps = Omit<ComponentPropsWithoutRef<"p">, "children"> & {
  children?: ReactNode | ((failure: InlineEditFailure) => ReactNode);
};

/** Validation or save failure, linked to the input. Renders nothing otherwise. */
export const InlineEditError = forwardRef<HTMLParagraphElement, InlineEditErrorProps>(function InlineEditError(
  { children, className, ...props },
  ref,
) {
  const { variant, failure, errorId, animated } = useInlineEdit();
  if (!failure) return null;
  const retry = variant === "ghost" ? "Couldn’t save. Press Enter to try again." : "Couldn’t save. Try again or cancel.";
  const fallback = failure.type === "invalid" ? failure.message : retry;
  return (
    <p ref={ref} id={errorId} role="alert" className={cn("text-sm text-destructive", animated && enter, className)} {...props}>
      {typeof children === "function" ? children(failure) : children ?? fallback}
    </p>
  );
});

export type InlineEditConflictProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  children?: ReactNode | ((conflict: { latest: string; acceptLatest: () => void; keepDraft: () => void }) => ReactNode);
};

/** Shown when the value changes elsewhere during an unsaved edit. Saving waits for a choice. */
export const InlineEditConflict = forwardRef<HTMLDivElement, InlineEditConflictProps>(function InlineEditConflict(
  { children, className, ...props },
  ref,
) {
  const { conflict, value, animated, acceptLatest, keepDraft } = useInlineEdit();
  if (!conflict) return null;
  return (
    <div
      ref={ref}
      role="status"
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-muted px-3 py-2 text-sm", animated && enter, className)}
      {...props}
    >
      {typeof children === "function" ? (
        children({ latest: value, acceptLatest, keepDraft })
      ) : children ?? (
        <>
          <span className="text-muted-foreground">
            Changed elsewhere to <span className="font-medium text-foreground">“{value}”</span>.
          </span>
          <button type="button" className="font-medium underline underline-offset-4" onClick={acceptLatest}>
            Use latest
          </button>
          <button type="button" className="font-medium underline underline-offset-4" onClick={keepDraft}>
            Keep mine
          </button>
        </>
      )}
    </div>
  );
});
