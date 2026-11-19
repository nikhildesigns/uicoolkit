"use client";

import { type ComponentPropsWithoutRef, type ReactNode, forwardRef, useState, useRef, useId } from "react";
import { useDailyTaskListContext } from "./daily-task-list-state";
import { cn } from "@/lib/utils";

export type DailyTaskListHeaderProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** The day, for example “Today” or “Monday 2 November”. */
  label: ReactNode;
  /** Extra content beside the label, such as a date picker you provide. */
  children?: ReactNode;
};

/** The day label and a progress summary of completed tasks. */
export const DailyTaskListHeader = forwardRef<HTMLDivElement, DailyTaskListHeaderProps>(function DailyTaskListHeader(
  { label, className, children, ...props },
  ref,
) {
  const { active, completed, messages, animated } = useDailyTaskListContext("DailyTaskListHeader");
  const total = active.length + completed.length;
  const done = completed.length;
  return (
    <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold">{label}</h3>
        {children}
        {total > 0 && <p className="shrink-0 text-xs text-muted-foreground">{messages.progress(done, total)}</p>}
      </div>
      {total > 0 && (
        <div
          role="progressbar"
          aria-label={messages.progress(done, total)}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          className="h-1 overflow-hidden rounded-full bg-muted"
        >
          <div className={cn("h-full rounded-full bg-primary", animated && "transition-[width] duration-500 ease-out motion-reduce:transition-none")} style={{ width: `${(done / total) * 100}%` }} />
        </div>
      )}
    </div>
  );
});

/** Quick capture. The text stays until your app confirms the new task; a rejected title or failed save keeps it with a message. */
export const DailyTaskListCapture = forwardRef<HTMLFormElement, Omit<ComponentPropsWithoutRef<"form">, "children">>(function DailyTaskListCapture(
  { className, onSubmit, ...props },
  ref,
) {
  const { create, validate, messages, disabled } = useDailyTaskListContext("DailyTaskListCapture");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const errorId = useId();
  if (!create) return null;

  const submit = () => {
    const invalid = validate(text);
    if (invalid) return setError(invalid);
    setError(null);
    const result = create(text.trim());
    const added = () => {
      setText("");
      input.current?.focus();
    };
    if (!(result instanceof Promise)) return added();
    setPending(true);
    result.then(
      () => {
        setPending(false);
        added();
      },
      () => {
        setPending(false);
        setError(messages.failed("create", text.trim()));
      },
    );
  };

  return (
    <form
      ref={ref}
      className={cn("flex flex-col gap-1.5", className)}
      onSubmit={(event) => {
        onSubmit?.(event);
        event.preventDefault();
        if (!pending && !disabled) submit();
      }}
      {...props}
    >
      <div className="flex gap-2">
        <input
          ref={input}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError(null);
          }}
          placeholder={messages.placeholder}
          aria-label={messages.placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-busy={pending || undefined}
          disabled={disabled}
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring disabled:opacity-50 aria-invalid:border-destructive sm:text-sm"
        />
        <button
          type="submit"
          aria-disabled={pending || disabled || undefined}
          className="h-9 shrink-0 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-opacity hover:bg-primary/90 focus-visible:outline-none focus-visible:bg-primary/90 aria-disabled:opacity-50"
        >
          {messages.add}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-2 px-1 text-xs text-destructive">
          {error}
          {error !== validate(text) && (
            <button type="button" onClick={submit} className="font-medium underline underline-offset-4">
              {messages.retry}
            </button>
          )}
        </p>
      )}
    </form>
  );
});
