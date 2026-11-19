"use client";

import type { ReactNode } from "react";
import { Check, FileText, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadEntry } from "./upload-queue";

export type RowRenderer = (entry: UploadEntry, retry: () => void) => ReactNode;

export function UploadRow({ entry, retry, motion, disabled, renderRow }: {
  entry: UploadEntry; retry: (id: number) => void; motion: boolean; disabled?: boolean; renderRow?: RowRenderer;
}) {
  const { id, name, status, progress, message } = entry;
  const percent = progress === undefined ? undefined : Math.round(progress * 100);
  if (renderRow) return <li data-status={status}>{renderRow(entry, () => retry(id))}</li>;
  return <li data-status={status} className="grid gap-1.5 rounded-md bg-border/65 px-3 py-2.5 dark:bg-muted/65">
    <div className="flex min-w-0 items-center gap-2">
      <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <span title={name} className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
      {status === "uploaded" && <>
        <Check aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span className="sr-only">Uploaded</span>
      </>}
      {status === "uploading" && <span className="text-xs tabular-nums text-muted-foreground">{percent === undefined ? "Uploading…" : `${percent}%`}</span>}
      {status === "failed" && <button type="button" data-retry={id} disabled={disabled} aria-label={`Retry ${name}`} title="Retry upload" onClick={() => retry(id)}
        className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
        <RotateCcw aria-hidden="true" className="size-4" />
      </button>}
    </div>
    {message && <p className="break-words text-xs text-destructive">{message}</p>}
    {status === "uploading" && <div role="progressbar" aria-label={`Upload progress for ${name}`}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
      className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
      <div className={cn("h-full rounded-full bg-primary",
        percent === undefined && "w-1/3", motion && (percent === undefined ? "motion-safe:animate-pulse" : "motion-safe:transition-[width]"))}
        style={percent !== undefined ? { width: `${percent}%` } : undefined} />
    </div>}
  </li>;
}
