"use client";

import { Popover } from "@base-ui/react/popover";
import { type ComponentPropsWithoutRef, type ReactNode, forwardRef, useRef, useState, useSyncExternalStore } from "react";
import { useFileDrop } from "./image-picker-root";
import { useImagePicker } from "./image-picker-state";
import { cn } from "@/lib/utils";

const phoneQuery = "(max-width: 639px)";
const subscribe = (notify: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(phoneQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
/** Phones get a bottom sheet; the server renders the desktop popover, then adapts. */
const usePhone = () => useSyncExternalStore(subscribe, () => typeof window.matchMedia === "function" && window.matchMedia(phoneQuery).matches, () => false);

/** A light checkerboard behind images, so transparent parts read as transparent. */
const checkerboard = "bg-[conic-gradient(#d4d4d8_25%,#fff_0_50%,#d4d4d8_0_75%,#fff_0)] bg-[length:8px_8px]";

const imageIcon = (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.25" y="2.75" width="11.5" height="10.5" rx="1.5" />
    <circle cx="6" cy="6.25" r="1.25" />
    <path d="m2.75 11.5 3.5-3.25 2.5 2.25 1.75-1.5 3 2.5" />
  </svg>
);
const uploadIcon = (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 10.5V2.75M5 5.5l3-2.75 3 2.75M2.75 10v2a1.25 1.25 0 0 0 1.25 1.25h8A1.25 1.25 0 0 0 13.25 12v-2" />
  </svg>
);

/**
 * The image to show: an upload in progress, else the committed one. The picker also keeps showing a
 * file whose upload failed, beside its Retry; the row goes back to the committed image.
 */
function useShown(withFailed = false) {
  const picker = useImagePicker();
  const { status, value } = picker;
  if ((status.kind === "uploading" || (withFailed && status.kind === "error")) && status.preview) return { src: status.preview, name: status.kind === "uploading" ? status.name : value?.name };
  if (picker.mixed || !value) return null;
  return { src: value.src, name: value.name };
}

/** An image that shows an icon instead when it fails to load. */
function Picture({ src, alt, className, fit = "cover" }: { src: string; alt: string; className?: string; fit?: "cover" | "contain" }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === src)
    return (
      <span className={cn("grid size-full place-items-center bg-muted text-muted-foreground [&_svg]:size-4", className)} title={alt}>
        {imageIcon}
      </span>
    );
  return (
    <img src={src} alt={alt} draggable={false} onError={() => setFailed(src)} className={cn("size-full", fit === "cover" ? "object-cover" : "object-contain", className)} />
  );
}

/**
 * The row: one button that opens the picker, holding the label, a thumbnail and the image's name.
 * Files can be dropped on it or pasted while it has focus.
 */
export const ImagePickerField = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(function ImagePickerField({ className, children, ...props }, ref) {
  const picker = useImagePicker();
  return (
    <Popover.Trigger
      ref={ref}
      disabled={!picker.editable}
      aria-label={picker.messages.open(picker.label)}
      aria-describedby={picker.status.kind === "error" ? picker.errorId : undefined}
      className={cn(
        "flex min-w-0 items-center gap-2 text-left text-sm outline-none",
        "focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 group-data-[readonly]/image:opacity-100",
        "group-data-[dragging]/image:border-ring group-data-[dragging]/image:bg-primary/5",
        picker.animated && "transition-colors duration-100 motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      {children}
    </Popover.Trigger>
  );
});

/** The image's name, such as "Fill"; place it inside the field or before it. */
export const ImagePickerLabel = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function ImagePickerLabel({ className, ...props }, ref) {
  const picker = useImagePicker();
  return (
    <span ref={ref} aria-hidden className={cn("truncate text-sm text-muted-foreground", className)} {...props}>
      {picker.label}
    </span>
  );
});

/** A small square preview of the image, with a progress ring while it uploads. */
export const ImagePickerThumbnail = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function ImagePickerThumbnail({ className, ...props }, ref) {
  const picker = useImagePicker();
  const shown = useShown();
  const uploading = picker.status.kind === "uploading";
  return (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        "relative grid size-6 shrink-0 place-items-center overflow-hidden rounded-[5px] ring-1 ring-foreground/15 ring-inset [&_svg]:size-3.5",
        shown ? checkerboard : "border border-dashed border-foreground/25 text-muted-foreground ring-0",
        className,
      )}
      {...props}
    >
      {shown ? <Picture src={shown.src} alt="" className={cn(uploading && "opacity-50")} /> : imageIcon}
      {uploading && <span className="absolute inset-1 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />}
    </span>
  );
});

/** The image's name, Mixed, an upload in progress, or a prompt to add one. */
export const ImagePickerName = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function ImagePickerName({ className, ...props }, ref) {
  const picker = useImagePicker();
  const { status, value, messages } = picker;
  const text =
    status.kind === "uploading" ? messages.uploading(status.name) : picker.mixed ? messages.mixed : value ? (value.name ?? messages.empty) : messages.empty;
  const muted = status.kind === "uploading" || picker.mixed || !value;
  return (
    <span ref={ref} className={cn("min-w-0 flex-1 truncate", muted && "text-muted-foreground", className)} {...props}>
      {text}
    </span>
  );
});

type ContentProps = ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** "fixed" (the default) keeps the picker whole inside panels that clip or scroll. */
  positionMethod?: "absolute" | "fixed";
  /** What the picker opens beside. Defaults to the row, or the nearest box around it when the row is laid out as contents. */
  anchor?: Element | null;
};

const rowAnchor = (root: HTMLElement | null) => {
  let element: HTMLElement | null = root;
  while (element && getComputedStyle(element).display === "contents") element = element.parentElement;
  return element;
};

/** The picker: a popover beside the row, or a bottom sheet on phones. Pasting anywhere in it adds the image. */
export const ImagePickerContent = forwardRef<HTMLDivElement, ContentProps>(function ImagePickerContent(
  { className, side = "bottom", align = "start", positionMethod = "fixed", anchor, children, ...props },
  ref,
) {
  const picker = useImagePicker();
  const phone = usePhone();
  const popupRef = useRef<HTMLDivElement | null>(null);
  return (
    <Popover.Portal container={picker.container ?? undefined}>
      <Popover.Positioner
        anchor={anchor ?? (() => rowAnchor(picker.rootRef.current))}
        side={side}
        align={align}
        sideOffset={6}
        collisionAvoidance={{ side: "flip", align: "shift", fallbackAxisSide: "end" }}
        positionMethod={positionMethod}
        className="z-50 outline-none"
        style={phone ? { position: "fixed", top: "auto", bottom: 0, left: 0, right: 0, width: "100%", transform: "none" } : undefined}
      >
        <Popover.Popup
          ref={(node) => {
            popupRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          aria-label={picker.label}
          // Focus lands on the picker itself, so a paste works at once and phones keep their keyboard closed.
          initialFocus={popupRef}
          className={cn(
            "grid w-64 gap-3 rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-[0_16px_40px_-12px_rgb(0_0_0/0.45),0_4px_12px_-4px_rgb(0_0_0/0.25)] outline-none",
            phone && "w-full rounded-t-2xl rounded-b-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
            picker.animated &&
              (phone
                ? "transition-[transform,opacity] duration-200 ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full motion-reduce:transition-none"
                : "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 ease-out data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none"),
            className,
          )}
          {...props}
        >
          {children}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
});

const smallButton =
  "inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

/**
 * The large area: the image, or a prompt to choose, drop or paste one. While a file uploads it shows
 * the file with a progress bar and Cancel; a failed upload shows Retry.
 */
export const ImagePickerDropArea = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function ImagePickerDropArea({ className, ...props }, ref) {
  const picker = useImagePicker();
  const shown = useShown(true);
  const drop = useFileDrop(picker);
  const { status, messages } = picker;
  const uploading = status.kind === "uploading";
  return (
    <div
      ref={ref}
      data-dragging={drop.over || undefined}
      {...drop.handlers}
      // The row's own drop handling would add the file a second time.
      onDrop={(event) => {
        event.stopPropagation();
        drop.handlers.onDrop(event);
      }}
      className={cn(
        "relative grid aspect-[4/3] place-items-center overflow-hidden rounded-md border border-input bg-muted/40",
        "data-[dragging]:border-ring data-[dragging]:bg-primary/5 data-[dragging]:ring-[3px] data-[dragging]:ring-ring/30",
        shown && !drop.over && checkerboard,
        className,
      )}
      {...props}
    >
      {shown ? (
        <Picture src={shown.src} alt={shown.name ?? picker.label} fit="contain" className={cn(uploading && "opacity-60")} />
      ) : (
        // Empty: the whole area is one button that opens the file dialog.
        <button
          type="button"
          disabled={!picker.editable}
          onClick={picker.choose}
          className="absolute inset-0 grid place-content-center justify-items-center gap-1.5 rounded-md px-3 text-center outline-none focus-visible:bg-foreground/5"
        >
          <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4">{uploadIcon}</span>
          <span className="text-sm font-medium">{drop.over ? messages.drop : messages.choose}</span>
          <span className="text-xs text-muted-foreground">{drop.over ? "" : `${messages.drop.toLowerCase()} ${messages.paste}`}</span>
        </button>
      )}
      {shown && drop.over && (
        <span className="absolute inset-0 grid place-items-center bg-background/80 text-sm font-medium backdrop-blur-[2px]">{messages.drop}</span>
      )}
      {uploading && (
        <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-md bg-background/90 p-1.5 pl-2.5 shadow-sm backdrop-blur-sm">
          <div
            role="progressbar"
            aria-label={messages.uploading(status.name)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={status.progress === null ? undefined : Math.round(status.progress * 100)}
            className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/15"
          >
            {status.progress === null ? (
              // No progress reported yet: a bar that sweeps, or holds still with reduced motion.
              <span className="absolute inset-y-0 left-0 w-1/3 animate-[upload-progress-sweep_1.2s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:animate-none" />
            ) : (
              <span
                className={cn("absolute inset-y-0 left-0 rounded-full bg-primary", picker.animated && "transition-[width] duration-200 motion-reduce:transition-none")}
                style={{ width: `${status.progress * 100}%` }}
              />
            )}
          </div>
          <button type="button" onClick={picker.cancel} className={cn(smallButton, "h-6 px-2 hover:bg-foreground/10")}>
            {messages.cancel}
          </button>
          <style>{"@keyframes upload-progress-sweep{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}"}</style>
        </div>
      )}
    </div>
  );
});

/** What went wrong with the last file or link, with Retry when an upload failed. Announced as it appears. */
export const ImagePickerError = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function ImagePickerError({ className, ...props }, ref) {
  const picker = useImagePicker();
  const { status, messages } = picker;
  return (
    <div ref={ref} role="alert" id={picker.errorId} className={cn(status.kind !== "error" && "hidden", "flex items-center gap-2 text-xs text-destructive", className)} {...props}>
      {status.kind === "error" && (
        <>
          <span className="min-w-0 flex-1">{status.message}</span>
          {status.canRetry && (
            <button type="button" onClick={picker.retry} className={cn(smallButton, "h-6 px-2 text-foreground hover:bg-foreground/10")}>
              {messages.retry}
            </button>
          )}
        </>
      )}
    </div>
  );
});

/** A field for a link to an image: Enter or Add commits it. */
export const ImagePickerUrlInput = forwardRef<HTMLFormElement, ComponentPropsWithoutRef<"form">>(function ImagePickerUrlInput({ className, ...props }, ref) {
  const picker = useImagePicker();
  const [text, setText] = useState("");
  return (
    <form
      ref={ref}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (text.trim() && picker.addUrl(text)) setText("");
      }}
      className={cn("flex h-8 items-center gap-1 rounded-md border border-input bg-background pr-0.5 pl-2.5 shadow-xs focus-within:border-ring", className)}
      {...props}
    >
      <input
        type="url"
        inputMode="url"
        value={text}
        disabled={!picker.editable}
        onChange={(event) => setText(event.target.value)}
        placeholder={picker.messages.url}
        aria-label={picker.messages.url}
        aria-describedby={picker.status.kind === "error" ? picker.errorId : undefined}
        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button type="submit" disabled={!picker.editable || !text.trim()} className={cn(smallButton, "h-6 px-2 hover:bg-foreground/10")}>
        {picker.messages.addUrl}
      </button>
    </form>
  );
});

const tile =
  "relative aspect-square overflow-hidden rounded-md ring-1 ring-foreground/15 outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
const closeIcon = (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
    <path d="m4.5 4.5 7 7m0-7-7 7" />
  </svg>
);

type LibraryProps = ComponentPropsWithoutRef<"div"> & {
  /** How many tiles to a line. */
  columns?: number;
  /** Shows Remove beside the heading while there is an image. */
  removable?: boolean;
  /** Rows between the heading and the grid, such as the link field. */
  children?: ReactNode;
};

/**
 * The picker's grid: an Upload tile first, then the image being uploaded, the current image when it
 * is not in your library, then your library. The current image is marked, so the grid doubles as the
 * preview. Drop files anywhere on it; Remove sits beside the heading, and children, such as the link
 * field, sit between the heading and the grid.
 */
export const ImagePickerLibrary = forwardRef<HTMLDivElement, LibraryProps>(function ImagePickerLibrary(
  { className, columns = 4, removable = true, children, ...props },
  ref,
) {
  const picker = useImagePicker();
  const drop = useFileDrop(picker);
  const { status, value, messages } = picker;
  const current = picker.mixed ? null : value;
  // An uploaded or linked image joins the grid at the front, so it is always visible and marked.
  const images = current && !picker.library.some((image) => image.src === current.src) ? [current, ...picker.library] : picker.library;
  const pending = status.kind === "uploading" || (status.kind === "error" && status.preview) ? status : null;
  return (
    <div ref={ref} role="group" aria-label={messages.library} className={cn("grid gap-1.5", className)} {...props}>
      <div className="flex h-5 items-center justify-between gap-2">
        <span aria-hidden className="text-xs text-muted-foreground">
          {messages.library}
        </span>
        {removable && (picker.mixed || value) && (
          <button
            type="button"
            disabled={!picker.editable}
            onClick={picker.remove}
            className="rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-2 disabled:opacity-50"
          >
            {messages.remove}
          </button>
        )}
      </div>
      {children}
      <div
        data-dragging={drop.over || undefined}
        {...drop.handlers}
        // The row's own drop handling would add the file a second time.
        onDrop={(event) => {
          event.stopPropagation();
          drop.handlers.onDrop(event);
        }}
        className="-m-1 grid gap-1.5 rounded-lg p-1 data-[dragging]:bg-primary/5 data-[dragging]:ring-2 data-[dragging]:ring-ring/40"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        <button
          type="button"
          disabled={!picker.editable}
          onClick={picker.choose}
          aria-label={messages.upload}
          title={messages.upload}
          className={cn(
            tile,
            "grid place-items-center border border-dashed border-foreground/25 bg-transparent text-muted-foreground ring-0 hover:border-foreground/50 hover:text-foreground [&_svg]:size-4",
            drop.over && "border-ring text-foreground",
          )}
        >
          {uploadIcon}
        </button>
        {pending && (
          <div
            className={cn(tile, checkerboard, pending.kind === "error" && "ring-2 ring-destructive")}
            title={pending.kind === "uploading" ? messages.uploading(pending.name) : pending.message}
          >
            <Picture src={pending.preview!} alt="" className="opacity-50" />
            {pending.kind === "uploading" && (
              <>
                <div
                  role="progressbar"
                  aria-label={messages.uploading(pending.name)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pending.progress === null ? undefined : Math.round(pending.progress * 100)}
                  className="absolute inset-x-1.5 bottom-1.5 h-1 overflow-hidden rounded-full bg-foreground/20"
                >
                  {pending.progress === null ? (
                    // No progress reported yet: a bar that sweeps, or holds still with reduced motion.
                    <span className="absolute inset-y-0 left-0 w-1/3 animate-[upload-progress-sweep_1.2s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:animate-none" />
                  ) : (
                    <span
                      className={cn("absolute inset-y-0 left-0 rounded-full bg-primary", picker.animated && "transition-[width] duration-200 motion-reduce:transition-none")}
                      style={{ width: `${pending.progress * 100}%` }}
                    />
                  )}
                  <style>{"@keyframes upload-progress-sweep{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}"}</style>
                </div>
                <button
                  type="button"
                  onClick={picker.cancel}
                  aria-label={messages.cancel}
                  title={messages.cancel}
                  className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-background/90 text-foreground shadow-sm outline-none focus-visible:bg-foreground focus-visible:text-background [&_svg]:size-2.5"
                >
                  {closeIcon}
                </button>
              </>
            )}
          </div>
        )}
        {images.map((image) => {
          const chosen = current?.src === image.src && status.kind !== "uploading";
          return (
            <button
              key={image.src}
              type="button"
              disabled={!picker.editable}
              aria-pressed={chosen}
              aria-label={image.name ?? image.src}
              title={image.name}
              onClick={() => picker.pick(image)}
              className={cn(tile, checkerboard, "hover:ring-foreground/40", chosen && "ring-2 ring-primary hover:ring-primary")}
            >
              <Picture src={image.src} alt="" />
            </button>
          );
        })}
      </div>
    </div>
  );
});

/** Replace opens the file dialog; Remove clears the image. */
export const ImagePickerActions = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function ImagePickerActions({ className, ...props }, ref) {
  const picker = useImagePicker();
  const hasImage = picker.mixed || !!picker.value;
  return (
    <div ref={ref} className={cn("flex items-center gap-1.5", className)} {...props}>
      <button type="button" disabled={!picker.editable} onClick={picker.choose} className={cn(smallButton, "flex-1 border border-input bg-background shadow-xs hover:bg-foreground/5")}>
        {picker.messages.replace}
      </button>
      <button
        type="button"
        disabled={!picker.editable || !hasImage}
        onClick={picker.remove}
        className={cn(smallButton, "flex-1 border border-input bg-background text-destructive shadow-xs hover:bg-destructive/10")}
      >
        {picker.messages.remove}
      </button>
    </div>
  );
});
