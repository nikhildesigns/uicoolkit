"use client";

import { type ComponentPropsWithoutRef, type MutableRefObject, createContext, useContext } from "react";

/** An image your app stores: where it is, and optionally its name and size. */
export type ImageValue = { src: string; name?: string; width?: number; height?: number };

/**
 * Stores a chosen file and resolves with where it now lives. Report progress from 0 to 1 when you
 * can, and stop when the signal aborts (the person pressed Cancel or chose another image).
 */
export type ImagePickerUpload = (file: File, options: { signal: AbortSignal; onProgress: (fraction: number) => void }) => Promise<ImageValue>;

/** Replaceable text, for example to translate. */
export type ImagePickerMessages = {
  mixed: string;
  empty: string;
  open: (label: string) => string;
  drop: string;
  choose: string;
  paste: string;
  url: string;
  addUrl: string;
  invalidUrl: string;
  library: string;
  upload: string;
  replace: string;
  remove: string;
  uploading: (name: string) => string;
  cancel: string;
  retry: string;
  uploadFailed: string;
  loadFailed: string;
  wrongType: string;
  tooBig: (limit: string) => string;
};

export const defaultMessages: ImagePickerMessages = {
  mixed: "Mixed",
  empty: "Add image",
  open: (label) => `Edit ${label}`,
  drop: "Drop an image here",
  choose: "Choose a file",
  paste: "or paste one",
  url: "Image URL",
  addUrl: "Add",
  invalidUrl: "Enter a link that starts with https:// or http://.",
  library: "Library",
  upload: "Upload an image",
  replace: "Replace",
  remove: "Remove",
  uploading: (name) => `Uploading ${name}`,
  cancel: "Cancel",
  retry: "Retry",
  uploadFailed: "The upload failed.",
  loadFailed: "This image didn't load.",
  wrongType: "Choose a PNG, JPEG, GIF, WebP or SVG image.",
  tooBig: (limit) => `Choose an image under ${limit}.`,
};

export const defaultAccept = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

export type ImagePickerProps = Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> & {
  /** Names the image, such as "Fill". Labels the row and the picker. */
  label: string;
  /** The committed image, or null for none. Your app owns it. */
  value: ImageValue | null;
  /** The selection holds different images. */
  mixed?: boolean;
  /** Called once per finished change: an upload, a link, a library image, or null when removed. */
  onValueCommit: (value: ImageValue | null) => void;
  /**
   * Stores a chosen, dropped or pasted file. Without it, the picker commits a local object URL,
   * which only lasts for the page's session: fine for previews, not for saving.
   */
  onUpload?: ImagePickerUpload;
  /** Images your app already has, such as recent uploads or assets, shown as a grid. */
  library?: ImageValue[];
  /** File types allowed, as MIME types. */
  accept?: string[];
  /** The largest file allowed, in bytes. */
  maxSize?: number;
  disabled?: boolean;
  readOnly?: boolean;
  /** Opens the picker when it first renders, such as right after a fill becomes an image. */
  defaultOpen?: boolean;
  /** Popover transitions. Reduced motion is always honored. */
  motion?: boolean;
  /** Where the picker is portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  messages?: Partial<ImagePickerMessages>;
};

/** What the picker is doing with a file it was given. */
export type ImagePickerStatus =
  | { kind: "idle" }
  | { kind: "uploading"; name: string; preview: string; progress: number | null }
  | { kind: "error"; message: string; preview: string | null; canRetry: boolean };

export type ImagePickerContextValue = {
  label: string;
  value: ImageValue | null;
  mixed: boolean;
  status: ImagePickerStatus;
  /** Opens the file dialog. */
  choose: () => void;
  /** Checks and uploads the first image among some files, such as a drop or a paste. */
  addFiles: (files: Iterable<File>) => void;
  /** Checks and commits a link to an image; false when it is not a link. */
  addUrl: (url: string) => boolean;
  /** Commits an image, such as one from the library. */
  pick: (image: ImageValue) => void;
  remove: () => void;
  cancel: () => void;
  retry: () => void;
  /** Shows an error that is not about an upload, such as a link that did not load. */
  fail: (message: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  library: ImageValue[];
  accept: string[];
  disabled: boolean;
  readOnly: boolean;
  editable: boolean;
  animated: boolean;
  container?: HTMLElement | null;
  messages: ImagePickerMessages;
  errorId: string;
  /** The row, which the picker opens beside so it never covers it. */
  rootRef: MutableRefObject<HTMLDivElement | null>;
};

export const ImagePickerContext = createContext<ImagePickerContextValue | null>(null);

/** State of the nearest ImagePicker, for building custom parts. */
export function useImagePicker() {
  const context = useContext(ImagePickerContext);
  if (!context) throw new Error("ImagePicker parts must be rendered inside <ImagePicker>.");
  return context;
}

/** A file size in the largest whole unit that fits, such as "5 MB". */
export function formatBytes(bytes: number) {
  const units = ["bytes", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${Number.isInteger(size) ? size : size.toFixed(1)} ${units[unit]}`;
}

/** The last part of a link's path, as a name for the image. */
export function nameFromUrl(url: string) {
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : url;
  } catch {
    return url;
  }
}
