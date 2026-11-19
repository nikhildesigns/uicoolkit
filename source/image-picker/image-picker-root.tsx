"use client";

import { Popover } from "@base-ui/react/popover";
import { type DragEvent, type ClipboardEvent, forwardRef, useEffect, useId, useRef, useState } from "react";
import {
  type ImagePickerContextValue,
  type ImagePickerProps,
  type ImagePickerStatus,
  type ImageValue,
  ImagePickerContext,
  defaultAccept,
  defaultMessages,
  formatBytes,
  nameFromUrl,
} from "./image-picker-state";
import { cn } from "@/lib/utils";

const idle: ImagePickerStatus = { kind: "idle" };
const isLink = (text: string) => /^(https?:\/\/\S+|data:image\/[\w.+-]+;base64,\S+)$/i.test(text.trim());
const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

/** Image files and links from a paste, for any part that takes one. */
export function readPaste(event: ClipboardEvent, picker: ImagePickerContextValue) {
  if (!picker.editable) return;
  const files = Array.from(event.clipboardData?.files ?? []);
  if (files.length) {
    event.preventDefault();
    picker.addFiles(files);
    return;
  }
  const text = event.clipboardData?.getData("text/plain") ?? "";
  // Pasting into a text field types as usual unless the whole paste is a link.
  if (isLink(text) && !(event.target instanceof HTMLInputElement)) {
    event.preventDefault();
    picker.addUrl(text);
  }
}

/** Dropping files on an element: sets data-dragging while files are over it. */
export function useFileDrop(picker: ImagePickerContextValue) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  return {
    over,
    handlers: {
      onDragEnter: (event: DragEvent) => {
        if (!picker.editable || !hasFiles(event)) return;
        event.preventDefault();
        depth.current += 1;
        setOver(true);
      },
      onDragOver: (event: DragEvent) => {
        if (!picker.editable || !hasFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      },
      onDragLeave: () => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      },
      onDrop: (event: DragEvent) => {
        depth.current = 0;
        setOver(false);
        if (!picker.editable || !hasFiles(event)) return;
        event.preventDefault();
        picker.addFiles(Array.from(event.dataTransfer.files));
      },
    },
  };
}

/**
 * An image your app owns, edited from a compact row: pressing the row opens a picker where people
 * choose, drop or paste a file, enter a link, or pick from your library. Your upload callback
 * stores the file; the picker shows its progress, Cancel, and Retry when it fails.
 */
export const ImagePicker = forwardRef<HTMLDivElement, ImagePickerProps>(function ImagePicker(
  {
    label,
    value,
    mixed = false,
    onValueCommit,
    onUpload,
    library = [],
    accept = defaultAccept,
    maxSize,
    disabled = false,
    readOnly = false,
    defaultOpen = false,
    motion = true,
    container,
    messages: messagesProp,
    className,
    children,
    ...props
  },
  ref,
) {
  const messages = { ...defaultMessages, ...messagesProp };
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpenState] = useState(defaultOpen && !disabled && !readOnly);
  const [status, setStatus] = useState<ImagePickerStatus>(idle);
  const editable = !disabled && !readOnly;
  // The upload in flight, so Cancel, a newer file or unmounting stops it.
  const controller = useRef<AbortController | null>(null);
  const lastFile = useRef<File | null>(null);
  // Local previews to free once nothing shows them; a committed one stays, since the app shows it.
  const previews = useRef(new Set<string>());

  const release = (url: string | null) => {
    if (!url || !previews.current.has(url)) return;
    previews.current.delete(url);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const owned = previews.current;
    return () => {
      controller.current?.abort();
      for (const url of owned) URL.revokeObjectURL(url);
    };
  }, []);

  const settle = (next: ImagePickerStatus) =>
    setStatus((current) => {
      if (current.kind !== "idle" && current.preview && (next.kind === "idle" || next.preview !== current.preview)) release(current.preview);
      return next;
    });

  const commit = (next: ImageValue | null) => {
    controller.current?.abort();
    controller.current = null;
    settle(idle);
    onValueCommit(next);
  };

  const check = (file: File) => {
    const typeOk = accept.some((type) => (type.endsWith("/*") ? file.type.startsWith(type.slice(0, -1)) : file.type === type));
    if (!typeOk) return messages.wrongType;
    if (maxSize !== undefined && file.size > maxSize) return messages.tooBig(formatBytes(maxSize));
    return null;
  };

  const upload = async (file: File) => {
    controller.current?.abort();
    lastFile.current = file;
    const preview = URL.createObjectURL(file);
    previews.current.add(preview);
    const current = new AbortController();
    controller.current = current;
    settle({ kind: "uploading", name: file.name, preview, progress: null });
    try {
      const stored = onUpload
        ? await onUpload(file, {
            signal: current.signal,
            onProgress: (fraction) => {
              if (controller.current !== current) return;
              setStatus((state) => (state.kind === "uploading" ? { ...state, progress: Math.min(1, Math.max(0, fraction)) } : state));
            },
          })
        : { src: preview, name: file.name };
      if (controller.current !== current || current.signal.aborted) return;
      controller.current = null;
      // Without an upload callback the preview is the image, so it must outlive this status.
      if (stored.src === preview) previews.current.delete(preview);
      settle(idle);
      onValueCommit(stored);
    } catch (error) {
      if (controller.current !== current || current.signal.aborted) return;
      controller.current = null;
      const message = error instanceof Error && error.message ? error.message : messages.uploadFailed;
      setStatus({ kind: "error", message, preview, canRetry: true });
    }
  };

  const context: ImagePickerContextValue = {
    label,
    value,
    mixed,
    status,
    choose: () => editable && inputRef.current?.click(),
    addFiles: (files) => {
      if (!editable) return;
      const file = Array.from(files)[0];
      if (!file) return;
      // A file dropped or pasted on the row opens the picker, where its progress and any problem show.
      setOpenState(true);
      const problem = check(file);
      if (problem) {
        settle({ kind: "error", message: problem, preview: null, canRetry: false });
        return;
      }
      void upload(file);
    },
    addUrl: (url) => {
      const link = url.trim();
      if (!editable) return false;
      if (!isLink(link)) {
        setOpenState(true);
        settle({ kind: "error", message: messages.invalidUrl, preview: null, canRetry: false });
        return false;
      }
      commit({ src: link, name: link.startsWith("data:") ? undefined : nameFromUrl(link) });
      return true;
    },
    pick: (image) => editable && commit(image),
    remove: () => editable && commit(null),
    cancel: () => {
      controller.current?.abort();
      controller.current = null;
      settle(idle);
    },
    retry: () => {
      if (lastFile.current) void upload(lastFile.current);
    },
    fail: (message) => settle({ kind: "error", message, preview: null, canRetry: false }),
    open,
    setOpen: (next) => {
      setOpenState(next && editable);
      // A message about a file or link belongs to that attempt; closing clears it, an upload carries on.
      if (!next) setStatus((state) => (state.kind === "error" ? (release(state.preview), idle) : state));
    },
    library,
    accept,
    disabled,
    readOnly,
    editable,
    animated: motion,
    container,
    messages,
    errorId: `${id}-error`,
    rootRef,
  };

  const drop = useFileDrop(context);

  return (
    <ImagePickerContext.Provider value={context}>
      <Popover.Root open={open} onOpenChange={(next) => context.setOpen(next)}>
        <div
          ref={(node) => {
            rootRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          role="group"
          aria-label={label}
          data-mixed={mixed || undefined}
          data-empty={(!value && !mixed) || undefined}
          data-disabled={disabled || undefined}
          data-readonly={readOnly || undefined}
          data-uploading={status.kind === "uploading" || undefined}
          data-dragging={drop.over || undefined}
          onPaste={(event) => readPaste(event, context)}
          {...drop.handlers}
          className={cn("group/image flex min-w-0 items-center", className)}
          {...props}
        >
          {children}
          <input
            ref={inputRef}
            type="file"
            accept={accept.join(",")}
            tabIndex={-1}
            aria-hidden
            className="hidden"
            onChange={(event) => {
              const files = event.currentTarget.files;
              if (files?.length) context.addFiles(Array.from(files));
              // Choosing the same file again should still upload it.
              event.currentTarget.value = "";
            }}
          />
        </div>
      </Popover.Root>
    </ImagePickerContext.Provider>
  );
});
