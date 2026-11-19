"use client";

import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";
import { useInlineEdit, mergeRefs, enter } from "./inline-edit-state";
import { cn } from "@/lib/utils";

export type InlineEditPreviewProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  /** Replace the displayed value. */
  children?: ReactNode | ((value: string) => ReactNode);
  /** Shown when the value is empty. */
  placeholder?: ReactNode;
};

/** The committed value as a button that starts editing. Hidden while editing. */
export const InlineEditPreview = forwardRef<HTMLButtonElement, InlineEditPreviewProps>(function InlineEditPreview(
  { children, placeholder, className, onClick, onBlur, ...props },
  ref,
) {
  const { variant, value, label, editing, disabled, animated, start, previewRef } = useInlineEdit();
  if (editing) return null;
  const content = typeof children === "function" ? children(value) : children ?? (value || <span className="text-muted-foreground">{placeholder}</span>);
  return (
    <button
      ref={mergeRefs(ref, previewRef)}
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex items-center text-left text-sm outline-none focus-visible:underline focus-visible:underline-offset-4 disabled:opacity-50",
        variant === "ghost"
          ? // Hovering shows a faint underline where the editing line will draw in; no box highlight.
            cn(
              // Keyboard focus shows the underline in the editing color instead of a ring, except when it returns after editing.
              "relative min-h-8 rounded-sm px-1 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-muted-foreground/50 hover:after:scale-x-100 focus-visible:no-underline not-data-returned:focus-visible:after:scale-x-100 not-data-returned:focus-visible:after:bg-ring",
              animated && "after:transition-transform after:duration-200 after:ease-out motion-reduce:after:transition-none",
            )
          : "min-h-9 rounded-md px-2 hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) start();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        event.currentTarget.removeAttribute("data-returned");
      }}
      {...props}
    >
      <span className="sr-only">{label}: </span>
      {content}
    </button>
  );
});

/** Wraps the input and actions while editing. Enter submits; Escape cancels. */
export const InlineEditEditor = forwardRef<HTMLFormElement, ComponentPropsWithoutRef<"form">>(function InlineEditEditor(
  { className, onSubmit, onKeyDown, ...props },
  ref,
) {
  const { variant, editing, animated, save, cancel } = useInlineEdit();
  if (!editing) return null;
  return (
    <form
      ref={ref}
      noValidate
      className={cn(
        "flex items-center gap-2",
        variant === "ghost"
          ? // The underline draws in from the left when editing starts, and pulses while saving.
            cn(
              "relative after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-ring in-data-[status=pending]:after:animate-pulse in-data-[invalid]:after:bg-destructive",
              animated && "after:transition-transform after:duration-300 after:ease-out after:starting:scale-x-0 motion-reduce:after:transition-none",
            )
          : animated && enter,
        className,
      )}
      onSubmit={(event) => {
        onSubmit?.(event);
        event.preventDefault();
        save();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape") return;
        event.preventDefault();
        cancel();
      }}
      {...props}
    />
  );
});

export const InlineEditInput = forwardRef<HTMLInputElement, Omit<ComponentPropsWithoutRef<"input">, "value" | "defaultValue">>(
  function InlineEditInput({ className, onChange, onKeyDown, ...props }, ref) {
    const { variant, label, draft, status, failure, errorId, inputRef, setDraft } = useInlineEdit();
    return (
      <input
        ref={mergeRefs(ref, inputRef)}
        aria-label={label}
        aria-invalid={failure?.type === "invalid" || undefined}
        aria-describedby={failure ? errorId : undefined}
        readOnly={status === "pending"}
        className={cn(
          "w-full min-w-0 bg-transparent text-sm outline-none",
          variant === "ghost"
            ? // Same box and padding as the ghost preview, so the text does not move when editing starts.
              "h-8 px-1"
            : "h-9 rounded-md border border-input px-3 shadow-xs focus-visible:border-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className,
        )}
        {...props}
        value={draft}
        onChange={(event) => {
          onChange?.(event);
          if (!event.defaultPrevented) setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          // Enter confirms an input-method composition instead of submitting.
          if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
        }}
      />
    );
  },
);
