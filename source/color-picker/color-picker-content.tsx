"use client";

import { Popover } from "@base-ui/react/popover";
import { type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent, forwardRef, useRef, useSyncExternalStore } from "react";
import { type Hsv, clamp, hexToHsv, hexToRgb, hslToRgb, hsvToHex, rgbToHsl, rgbToHsv } from "./color-picker-color";
import { ColorChip, ColorPickerAlphaInput, ColorPickerHexInput, ColorPickerNumberInput, checkerboard } from "./color-picker-inputs";
import { type ColorPickerFormat, useColorPicker } from "./color-picker-state";
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

type ContentProps = ComponentPropsWithoutRef<"div"> & {
  /** "fixed" (the default) keeps the picker whole inside panels that clip or scroll; "absolute" scrolls with the page. */
  positionMethod?: "absolute" | "fixed";
  /** Which side of the row the picker opens on, such as "left" in an inspector on the right edge. */
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** What the picker opens beside. Defaults to the picker's row, or the nearest box around it when the row is laid out as contents. */
  anchor?: Element | null;
};

/** The row, or its nearest ancestor with a box: a row with display: contents measures as nothing at the window's corner. */
const rowAnchor = (root: HTMLElement | null) => {
  let element: HTMLElement | null = root;
  while (element && getComputedStyle(element).display === "contents") element = element.parentElement;
  return element;
};

/**
 * The picker: a popover beside the whole row, so it never covers the colour being edited, or a bottom
 * sheet on phones. Without room on its side it flips, then moves to the other axis. Escape or clicking outside closes it.
 */
export const ColorPickerContent = forwardRef<HTMLDivElement, ContentProps>(function ColorPickerContent(
  { className, positionMethod = "fixed", side = "bottom", align = "start", anchor, children, ...props },
  ref,
) {
  const picker = useColorPicker();
  const phone = usePhone();
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
          ref={ref}
          aria-label={picker.label}
          initialFocus={false}
          className={cn(
            // A deep, soft shadow, so the picker lifts off light and dark surfaces alike.
            "grid w-60 gap-3 rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-[0_16px_40px_-12px_rgb(0_0_0/0.45),0_4px_12px_-4px_rgb(0_0_0/0.25)] outline-none",
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

/** Tracks a press on an element as fractions of its width and height, until release. */
function usePointerTrack(onMove: (x: number, y: number) => void, onEnd: () => void) {
  const pressed = useRef<number | null>(null);
  const at = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onMove(clamp((event.clientX - rect.left) / (rect.width || 1), 0, 1), clamp((event.clientY - rect.top) / (rect.height || 1), 0, 1));
  };
  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      pressed.current = event.pointerId;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
      event.currentTarget.focus();
      at(event);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => pressed.current === event.pointerId && at(event),
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (pressed.current !== event.pointerId) return;
      pressed.current = null;
      onEnd();
    },
    onPointerCancel: () => {
      pressed.current = null;
      onEnd();
    },
  };
}

const thumb = "pointer-events-none absolute size-3.5 -translate-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_1px_3px_rgb(0_0_0/0.4)]";

/** Steps a value with the arrow keys: 1 at a time, or 10 with Shift; Home and End go to the ends. */
function stepKeys(event: KeyboardEvent, keys: { less: string[]; more: string[] }, apply: (delta: number | "min" | "max") => void) {
  const big = event.shiftKey ? 10 : 1;
  if (keys.less.includes(event.key)) apply(-big);
  else if (keys.more.includes(event.key)) apply(big);
  else if (event.key === "Home") apply("min");
  else if (event.key === "End") apply("max");
  else return;
  event.preventDefault();
}

/** Saturation left to right, brightness bottom to top. Drag to preview, release to commit; arrow keys step it. */
export const ColorPickerArea = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function ColorPickerArea({ className, ...props }, ref) {
  const picker = useColorPicker();
  const { hsv, alpha } = picker.color ?? picker.fallback;
  const track = usePointerTrack((x, y) => picker.preview({ hsv: { h: hsv.h, s: x, v: 1 - y }, alpha }), picker.release);
  const saturation = Math.round(hsv.s * 100);
  const brightness = Math.round(hsv.v * 100);
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={picker.disabled ? -1 : 0}
      aria-label={picker.messages.area}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={saturation}
      aria-valuetext={picker.messages.areaValue(saturation, brightness)}
      aria-disabled={picker.disabled || undefined}
      aria-readonly={picker.readOnly || undefined}
      className={cn("relative h-36 touch-none rounded-md outline-none select-none focus-visible:ring-1 focus-visible:ring-ring", picker.editable && "cursor-crosshair", className)}
      // White to the hue across, then fading to black downwards.
      style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hsvToHex({ h: hsv.h, s: 1, v: 1 })})` }}
      {...(picker.editable ? track : {})}
      onKeyDown={(event) => {
        if (!picker.editable) return;
        stepKeys(event, { less: ["ArrowLeft"], more: ["ArrowRight"] }, (delta) => {
          const s = delta === "min" ? 0 : delta === "max" ? 1 : clamp(hsv.s + delta / 100, 0, 1);
          picker.commit({ hsv: { ...hsv, s }, alpha });
        });
        stepKeys(event, { less: ["ArrowDown"], more: ["ArrowUp"] }, (delta) => {
          if (delta === "min" || delta === "max") return;
          picker.commit({ hsv: { ...hsv, v: clamp(hsv.v + delta / 100, 0, 1) }, alpha });
        });
      }}
      {...props}
    >
      <span className={thumb} style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hsvToHex(hsv) }} />
    </div>
  );
});

type SliderProps = ComponentPropsWithoutRef<"div"> & { channel: "hue" | "alpha" };

/** A horizontal hue or opacity slider. Drag to preview, release to commit; arrow keys step it. */
export const ColorPickerSlider = forwardRef<HTMLDivElement, SliderProps>(function ColorPickerSlider({ channel, className, ...props }, ref) {
  const picker = useColorPicker();
  const { hsv, alpha } = picker.color ?? picker.fallback;
  const hue = channel === "hue";
  const max = hue ? 360 : 100;
  const current = hue ? hsv.h : alpha * 100;
  const set = (next: number) => (hue ? { hsv: { ...hsv, h: clamp(next, 0, 359.99) }, alpha } : { hsv, alpha: clamp(next, 0, 100) / 100 });
  const track = usePointerTrack((x) => picker.preview(set(x * max)), picker.release);
  const solid = hsvToHex(hsv);
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={picker.disabled ? -1 : 0}
      aria-label={hue ? picker.messages.hue : picker.messages.opacity}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(current)}
      aria-valuetext={hue ? `${Math.round(current)}°` : `${Math.round(current)}%`}
      aria-disabled={picker.disabled || undefined}
      aria-readonly={picker.readOnly || undefined}
      className={cn("relative h-3 touch-none rounded-full outline-none select-none focus-visible:ring-1 focus-visible:ring-ring", !hue && checkerboard, picker.editable && "cursor-pointer", className)}
      {...(picker.editable ? track : {})}
      onKeyDown={(event) => {
        if (!picker.editable) return;
        stepKeys(event, { less: ["ArrowLeft", "ArrowDown"], more: ["ArrowRight", "ArrowUp"] }, (delta) =>
          picker.commit(set(delta === "min" ? 0 : delta === "max" ? max : current + delta)),
        );
      }}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ background: hue ? "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" : `linear-gradient(to right, transparent, ${solid})` }}
      />
      <span className={cn(thumb, "top-1/2")} style={{ left: `${(current / max) * 100}%`, background: hue ? hsvToHex({ h: hsv.h, s: 1, v: 1 }) : solid }} />
    </div>
  );
});

type EyeDropperWindow = { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } };
const eyeDropperSupported = () => typeof window !== "undefined" && "EyeDropper" in window;

/** Picks a colour from anywhere on screen. Shown only in browsers with the EyeDropper API. */
export const ColorPickerEyeDropper = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(function ColorPickerEyeDropper({ className, ...props }, ref) {
  const picker = useColorPicker();
  const supported = useSyncExternalStore(() => () => {}, eyeDropperSupported, () => false);
  if (!supported) return null;
  return (
    <button
      ref={ref}
      type="button"
      aria-label={picker.messages.eyedropper}
      title={picker.messages.eyedropper}
      disabled={!picker.editable}
      onClick={async () => {
        const Dropper = (window as unknown as EyeDropperWindow).EyeDropper;
        if (!Dropper) return;
        try {
          const { sRGBHex } = await new Dropper().open();
          picker.commit({ hsv: hexToHsv(sRGBHex), alpha: picker.alpha ?? 1 });
        } catch {
          // Cancelled with Escape: nothing changes.
        }
      }}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md border border-input text-muted-foreground shadow-xs outline-none hover:bg-accent hover:text-foreground focus-visible:border-ring focus-visible:text-foreground disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="m9.5 4 2.5 2.5M3 13l1-3 5.75-5.75a1.77 1.77 0 0 1 2.5 2.5L6.5 12.5Z" />
      </svg>
    </button>
  );
});

const formats: ColorPickerFormat[] = ["hex", "rgb", "hsl"];

type SwitchProps = ComponentPropsWithoutRef<"div"> & {
  /** Class for the knob that slides to the chosen format. */
  highlightClassName?: string;
};

/**
 * Chooses the format the value shows, styled like Inspector Field's Off/On toggle: a muted track
 * with a raised knob that slides to the choice. Arrow keys move between formats; the chosen one is the single tab stop.
 */
export const ColorPickerFormatSwitch = forwardRef<HTMLDivElement, SwitchProps>(function ColorPickerFormatSwitch({ highlightClassName, className, onKeyDown, ...props }, ref) {
  const picker = useColorPicker();
  const index = formats.indexOf(picker.format);
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={picker.messages.format}
      className={cn("relative isolate grid h-8 grid-cols-3 rounded-md border border-input bg-muted p-0.5 text-sm dark:bg-input/40", className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
        if (event.defaultPrevented || !step) return;
        event.preventDefault();
        const next = formats[(index + step + formats.length) % formats.length];
        picker.setFormat(next);
        event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[formats.indexOf(next)]?.focus();
      }}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0.5 left-0.5 -z-10 w-[calc((100%-0.25rem)/3)] rounded-sm bg-background shadow-sm ring-1 ring-border",
          picker.animated && "transition-transform duration-200 ease-out motion-reduce:transition-none",
          highlightClassName,
        )}
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {formats.map((format) => (
        <button
          key={format}
          type="button"
          role="radio"
          aria-checked={picker.format === format}
          tabIndex={picker.format === format ? 0 : -1}
          onClick={() => picker.setFormat(format)}
          className="rounded-md text-muted-foreground outline-none select-none focus-visible:bg-foreground/10 focus-visible:text-foreground aria-checked:text-foreground"
        >
          {picker.messages.formats[format]}
        </button>
      ))}
    </div>
  );
});

/** The colour in the chosen format, with opacity. The app always receives hex and opacity. */
export const ColorPickerValue = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function ColorPickerValue({ className, ...props }, ref) {
  const picker = useColorPicker();
  const hsv: Hsv | null = picker.color?.hsv ?? null;
  const rgb = picker.hex ? hexToRgb(picker.hex) : null;
  const hsl = rgb ? rgbToHsl(rgb) : null;
  const alpha = picker.alpha ?? 1;
  const fromRgb = (next: Partial<{ r: number; g: number; b: number }>) => rgb && picker.commit({ hsv: rgbToHsv({ ...rgb, ...next }), alpha });
  const fromHsl = (next: Partial<{ h: number; s: number; l: number }>) => {
    if (!hsl || !hsv) return;
    const converted = rgbToHsv(hslToRgb({ ...hsl, ...next }));
    // Keep the chosen hue even when the colour is grey.
    picker.commit({ hsv: { ...converted, h: next.h ?? hsv.h }, alpha });
  };
  const channel = (key: keyof typeof picker.messages.channels, value: number | null, max: number, apply: (value: number) => void) => (
    <ColorPickerNumberInput aria-label={`${picker.label} ${picker.messages.channels[key]}`} value={value} min={0} max={max} onApply={apply} className="flex-1" />
  );
  return (
    <div
      ref={ref}
      className={cn("flex h-8 items-center gap-1 rounded-md border border-input px-1.5 focus-within:border-ring", className)}
      {...props}
    >
      {picker.format === "hex" && <ColorPickerHexInput id={`${picker.inputId}-popup`} className="flex-1" />}
      {picker.format === "rgb" && (
        <>
          {channel("r", rgb && Math.round(rgb.r), 255, (r) => fromRgb({ r }))}
          {channel("g", rgb && Math.round(rgb.g), 255, (g) => fromRgb({ g }))}
          {channel("b", rgb && Math.round(rgb.b), 255, (b) => fromRgb({ b }))}
        </>
      )}
      {picker.format === "hsl" && (
        <>
          {channel("h", hsv && Math.round(hsv.h), 360, (h) => fromHsl({ h: h % 360 }))}
          {channel("s", hsl && Math.round(hsl.s * 100), 100, (s) => fromHsl({ s: s / 100 }))}
          {channel("l", hsl && Math.round(hsl.l * 100), 100, (l) => fromHsl({ l: l / 100 }))}
        </>
      )}
      <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
      <ColorPickerAlphaInput />
    </div>
  );
});

type FieldsProps = ComponentPropsWithoutRef<"div"> & {
  /** Class for the format switch. */
  formatClassName?: string;
  /** Class for the switch's sliding knob. */
  formatHighlightClassName?: string;
};

/** The format switch with the value below it, for pickers that keep them together. */
export const ColorPickerFields = forwardRef<HTMLDivElement, FieldsProps>(function ColorPickerFields({ formatClassName, formatHighlightClassName, className, ...props }, ref) {
  return (
    <div ref={ref} className={cn("grid gap-1.5", className)} {...props}>
      <ColorPickerFormatSwitch className={formatClassName} highlightClassName={formatHighlightClassName} />
      <ColorPickerValue />
    </div>
  );
});

/** Your app's swatches and the recently chosen colours. Choosing one commits it. */
export const ColorPickerSwatches = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function ColorPickerSwatches({ className, ...props }, ref) {
  const picker = useColorPicker();
  const groups = [
    { label: picker.messages.swatches, colors: picker.swatches },
    { label: picker.messages.recent, colors: picker.recent },
  ].filter((group) => group.colors.length > 0);
  if (groups.length === 0) return null;
  return (
    <div ref={ref} className={cn("grid gap-2", className)} {...props}>
      {groups.map((group) => (
        <div key={group.label} role="group" aria-label={group.label} className="grid gap-1.5">
          <span className="text-xs text-muted-foreground">{group.label}</span>
          <div className="flex flex-wrap gap-1.5">
            {group.colors.map((color) => {
              const chosen = !!picker.hex && picker.hex === color.hex && Math.round((picker.alpha ?? 1) * 100) === Math.round(color.alpha * 100);
              return (
                <button
                  key={`${color.hex}-${color.alpha}`}
                  type="button"
                  aria-label={picker.messages.swatch(color.hex, color.alpha)}
                  aria-pressed={chosen}
                  disabled={!picker.editable}
                  onClick={() => picker.commit({ hsv: hexToHsv(color.hex), alpha: color.alpha })}
                  className="size-5 overflow-hidden rounded-[4px] ring-1 ring-border outline-none ring-offset-1 ring-offset-popover focus-visible:ring-ring disabled:opacity-50 aria-pressed:ring-2 aria-pressed:ring-foreground"
                >
                  <ColorChip hex={color.hex} alpha={color.alpha} className="size-full" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});
