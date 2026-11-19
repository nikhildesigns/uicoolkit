"use client";

import { useEffect, useRef, useState } from "react";

export type UploadHandler = (file: File, onProgress: (fraction: number) => void, signal: AbortSignal) => Promise<void>;
export type UploadAccept = Record<string, readonly string[]>;
export type UploadEntry = {
  id: number;
  name: string;
  size: number;
  status: "uploading" | "uploaded" | "failed" | "rejected";
  progress?: number;
  message?: string;
};
export type UploadOptions = { upload: UploadHandler; accept?: UploadAccept; maxFiles?: number };

export function acceptedTypes(accept?: UploadAccept) {
  return Object.entries(accept ?? {}).flatMap(([mime, extensions]) => [mime, ...extensions])
    .map(token => token.trim().toLowerCase()).filter(Boolean);
}

function accepts(file: File, types: string[]) {
  return !types.length || types.some(type => {
    if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type);
    if (type.endsWith("/*")) return file.type.toLowerCase().startsWith(type.slice(0, -1));
    return file.type.toLowerCase() === type;
  });
}

/** The upload callback supplies the transfer. Only failed files are kept for retry. */
export function useUploadQueue({ upload, accept, maxFiles = Infinity }: UploadOptions) {
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const nextId = useRef(0);
  const attempts = useRef(new Map<number, AbortController>());
  const failures = useRef(new Map<number, File>());
  useEffect(() => {
    const requests = attempts.current;
    const failed = failures.current;
    return () => {
      for (const controller of requests.values()) controller.abort();
      requests.clear();
      failed.clear();
    };
  }, []);

  function update(id: number, patch: Partial<UploadEntry>) {
    setEntries(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row));
  }

  async function run(id: number, file: File) {
    const controller = new AbortController();
    attempts.current.set(id, controller);
    try {
      await upload(file, fraction => {
        if (attempts.current.get(id) !== controller || !Number.isFinite(fraction)) return;
        update(id, { progress: Math.max(0, Math.min(1, fraction)) });
      }, controller.signal);
      if (!controller.signal.aborted) update(id, { status: "uploaded", progress: 1 });
    } catch (error) {
      if (!controller.signal.aborted) {
        failures.current.set(id, file);
        update(id, { status: "failed", message: error instanceof Error && error.message ? error.message : "Upload failed." });
      }
    } finally {
      attempts.current.delete(id);
    }
  }

  function addFiles(files: Iterable<File>) {
    const types = acceptedTypes(accept);
    const batch: UploadEntry[] = [];
    const pending: { id: number; file: File }[] = [];
    for (const file of files) {
      const id = ++nextId.current;
      let message: string | undefined;
      if (!accepts(file, types)) message = "File type isn’t accepted.";
      else if (pending.length >= maxFiles) message = `Limit is ${maxFiles} per selection.`;
      batch.push({ id, name: file.name, size: file.size, status: message ? "rejected" : "uploading", message });
      if (!message) pending.push({ id, file });
    }
    if (batch.length) setEntries(rows => [...rows, ...batch]);
    for (const { id, file } of pending) void run(id, file);
  }

  function retry(id: number) {
    const file = failures.current.get(id);
    if (!file) return;
    failures.current.delete(id);
    update(id, { status: "uploading", message: undefined, progress: undefined });
    void run(id, file);
  }
  return { entries, addFiles, retry };
}
