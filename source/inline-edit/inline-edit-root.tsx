"use client";

import { forwardRef, useState, useRef, useId, useEffect } from "react";
import { type InlineEditProps, type Session, type InlineEditStatus, type InlineEditFailure, type InlineEditContextValue, InlineEditContext, mergeRefs } from "./inline-edit-state";
import { cn } from "@/lib/utils";

export const InlineEdit = forwardRef<HTMLDivElement, InlineEditProps>(function InlineEdit(
  {
    value,
    onSave,
    label,
    validate,
    editing: editingProp,
    defaultEditing = false,
    onEditingChange,
    onCancel,
    disabled = false,
    motion = true,
    variant = "default",
    saveOnBlur = variant === "ghost",
    className,
    onBlur,
    ...props
  },
  ref,
) {
  const [uncontrolledEditing, setUncontrolledEditing] = useState(defaultEditing);
  const editing = editingProp ?? uncontrolledEditing;
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<InlineEditStatus>("idle");
  const [failure, setFailure] = useState<InlineEditFailure | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocus = useRef(false);
  const attempt = useRef(0);
  const errorId = useId();

  // Open, close and follow the committed value while editing.
  if (editing && !session) setSession({ draft: value, base: value });
  if (!editing && session) {
    setSession(null);
    setStatus("idle");
    setFailure(null);
  }
  // A new committed value replaces an untouched draft, or one that already matches it.
  if (session && value !== session.base && (session.draft === session.base || session.draft === value)) {
    setSession({ draft: value, base: value });
  }
  const conflict = !!session && value !== session.base;

  const wasEditing = useRef(editing);
  useEffect(() => {
    if (wasEditing.current === editing) return;
    wasEditing.current = editing;
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (restoreFocus.current) {
      // Marked so the ghost variant shows no focus line when focus comes back after Enter or Escape.
      previewRef.current?.setAttribute("data-returned", "");
      previewRef.current?.focus();
    }
    restoreFocus.current = false;
  }, [editing]);

  // Ignore results that arrive after unmount.
  useEffect(() => () => void attempt.current++, []);

  const setEditing = (next: boolean) => {
    if (editingProp === undefined) setUncontrolledEditing(next);
    onEditingChange?.(next);
  };

  const close = () => {
    restoreFocus.current = !!rootRef.current?.contains(document.activeElement);
    setEditing(false);
  };

  const save = async () => {
    if (!session || status === "pending" || conflict) return;
    const { draft } = session;
    if (draft === value) return close();
    const message = validate?.(draft);
    if (message) {
      setFailure({ type: "invalid", message });
      inputRef.current?.focus();
      return;
    }
    const current = ++attempt.current;
    setStatus("pending");
    setFailure(null);
    try {
      await onSave(draft);
      if (attempt.current !== current) return;
      setStatus("idle");
      close();
    } catch (cause) {
      if (attempt.current !== current) return;
      setStatus("error");
      setFailure({ type: "save", cause });
    }
  };

  const cancel = () => {
    if (status === "pending") return;
    close();
    onCancel?.();
  };

  const context: InlineEditContextValue = {
    variant,
    value,
    label,
    draft: session?.draft ?? value,
    editing,
    disabled,
    animated: motion,
    status,
    failure,
    conflict,
    errorId,
    inputRef,
    previewRef,
    setDraft: (draft) => {
      setSession((current) => current && { ...current, draft });
      if (failure?.type === "invalid") setFailure(null);
    },
    start: () => !disabled && setEditing(true),
    cancel,
    save: () => void save(),
    // The conflict notice unmounts after a choice, so focus moves back to the input.
    acceptLatest: () => {
      setSession({ draft: value, base: value });
      inputRef.current?.focus();
    },
    keepDraft: () => {
      setSession((current) => current && { ...current, base: value });
      inputRef.current?.focus();
    },
  };

  return (
    <InlineEditContext.Provider value={context}>
      <div
        ref={mergeRefs(ref, rootRef)}
        data-editing={editing || undefined}
        data-status={status}
        data-invalid={failure?.type === "invalid" || undefined}
        data-conflict={conflict || undefined}
        data-disabled={disabled || undefined}
        data-variant={variant}
        className={cn("grid", variant === "ghost" ? "gap-1" : "gap-2", className)}
        onBlur={(event) => {
          onBlur?.(event);
          // Focus moving within the editor (for example to a conflict choice) is not leaving it.
          if (!saveOnBlur || !session || rootRef.current?.contains(event.relatedTarget as Node | null)) return;
          if (status === "pending" || conflict) return;
          if (session.draft === value || validate?.(session.draft)) return cancel();
          void save();
        }}
        {...props}
      />
    </InlineEditContext.Provider>
  );
});
