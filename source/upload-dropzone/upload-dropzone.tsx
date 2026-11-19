"use client";

import { CloudUpload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { UploadRow, type RowRenderer } from "./upload-row";
import { acceptedTypes, useUploadQueue, type UploadAccept, type UploadEntry, type UploadOptions } from "./upload-queue";

export { useUploadQueue, type UploadHandler, type UploadEntry, type UploadAccept } from "./upload-queue";

type ViewProps = {
  accept?: UploadAccept; className?: string; buttonClassName?: string; hint?: string;
  motion?: boolean; disabled?: boolean; renderRow?: RowRenderer;
};
export type UploadDropzoneProps = UploadOptions & ViewProps;

function summary(entries: UploadEntry[]) {
  const counts = { uploaded: 0, uploading: 0, failed: 0, rejected: 0 };
  for (const { status } of entries) counts[status]++;
  const parts: string[] = [];
  if (counts.uploaded) parts.push(`${counts.uploaded} ${counts.uploaded === 1 ? "file" : "files"} uploaded`);
  for (const status of ["uploading", "failed", "rejected"] as const) {
    if (counts[status]) parts.push(`${counts[status]} ${status}`);
  }
  return parts.join(" · ");
}

export function UploadDropzoneView({ entries, addFiles, retry, accept, className, buttonClassName, hint,
  motion = true, disabled, renderRow }: ReturnType<typeof useUploadQueue> & ViewProps) {
  const picker = useRef<HTMLInputElement>(null);
  const browse = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const previousFailures = useRef(new Set<number>());
  const hintId = useId();
  const hasRows = entries.length > 0;

  useEffect(() => {
    const failed = entries.filter(row => row.status === "failed");
    const firstNew = failed.find(row => !previousFailures.current.has(row.id));
    previousFailures.current = new Set(failed.map(row => row.id));
    if (firstNew && document.activeElement === browse.current) {
      root.current?.querySelector<HTMLButtonElement>(`[data-retry="${firstNew.id}"]`)?.focus();
    }
  }, [entries]);

  function retryRow(id: number) {
    if (disabled) return;
    browse.current?.focus();
    retry(id);
  }

  return <section ref={root} aria-label="File uploads" className={cn("w-full min-w-0 rounded-xl border border-dashed border-border bg-background p-4 text-foreground",
    dragging && !disabled && "border-primary bg-primary/5", className)}
    onDragEnter={event => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      dragDepth.current++;
      setDragging(true);
    }}
    onDragLeave={event => {
      event.preventDefault();
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (!dragDepth.current) setDragging(false);
    }}
    onDragOver={event => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = disabled ? "none" : "copy";
    }}
    onDrop={event => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (!disabled) addFiles(event.dataTransfer.files);
    }}>
    <input ref={picker} type="file" hidden multiple disabled={disabled} accept={acceptedTypes(accept).join(",") || undefined}
      onChange={event => {
        if (!disabled && event.target.files) addFiles(event.target.files);
        event.target.value = "";
      }} />
    <div className={cn("flex gap-2", hasRows ? "flex-wrap items-center justify-between" : "flex-col items-center py-4 text-center")}>
      {!hasRows && <><span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <CloudUpload aria-hidden="true" className="size-5" /></span>
        <p className="text-sm font-medium">{dragging ? "Drop to add files" : "Drop files to upload"}</p></>}
      <p role="status" aria-atomic="true" className={cn("text-lg font-semibold leading-tight", !hasRows && "sr-only")}>{summary(entries)}</p>
      <button ref={browse} type="button" disabled={disabled} aria-describedby={hint ? hintId : undefined} onClick={() => picker.current?.click()}
        className={cn("min-h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground focus-visible:outline focus-visible:outline-1 disabled:opacity-50", buttonClassName)}>
        {hasRows ? "Add more files" : "Browse files"}
      </button>
    </div>
    {hasRows && <ul aria-label="Files" className="mt-3 grid max-h-80 min-w-0 gap-1.5 overflow-y-auto">
      {entries.map(entry => <UploadRow key={entry.id} entry={entry} motion={motion} disabled={disabled} retry={retryRow} renderRow={renderRow} />)}
    </ul>}
    {hint && <p id={hintId} className={cn("text-xs text-muted-foreground", hasRows ? "mt-3" : "mt-2 text-center")}>{hint}</p>}
  </section>;
}

export function UploadDropzone({ upload, maxFiles, ...props }: UploadDropzoneProps) {
  const queue = useUploadQueue({ upload, maxFiles, accept: props.accept });
  return <UploadDropzoneView {...props} {...queue} />;
}
