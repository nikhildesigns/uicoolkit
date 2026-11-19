"use client";

import { Popover } from "@base-ui/react/popover";
import { forwardRef, useId, useRef, useState } from "react";
import { type ColorValue, type Hsv, hexToHsv, hsvToHex, parseHex, sameColor } from "./color-picker-color";
import { type ColorPickerContextValue, type ColorPickerFormat, type ColorPickerProps, ColorPickerContext, defaultMessages, mergeRefs } from "./color-picker-state";
import { cn } from "@/lib/utils";

type Local = { hsv: Hsv; alpha: number };

const fromValue = (value: ColorValue | null): Local | null => (value ? { hsv: hexToHsv(value.hex), alpha: value.alpha } : null);
const toValue = (local: Local): ColorValue => ({ hex: hsvToHex(local.hsv), alpha: Math.round(local.alpha * 100) / 100 });
const toSwatch = (swatch: string | ColorValue): ColorValue | null => {
  if (typeof swatch !== "string") return { hex: parseHex(swatch.hex) ?? swatch.hex, alpha: swatch.alpha };
  const hex = parseHex(swatch);
  return hex ? { hex, alpha: 1 } : null;
};

/**
 * A colour your app owns, edited from a fill-style row: the swatch opens a picker with an area,
 * hue and opacity sliders, Hex/RGB/HSL entry, an eyedropper and swatches. Drags preview live and
 * commit once on release.
 */
export const ColorPicker = forwardRef<HTMLDivElement, ColorPickerProps>(function ColorPicker(
  {
    label,
    value,
    onValueCommit,
    onValueChange,
    swatches = [],
    recent: recentProp,
    onRecentChange,
    recentLimit = 8,
    format: formatProp,
    defaultFormat = "hex",
    defaultOpen = false,
    onFormatChange,
    disabled = false,
    readOnly = false,
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpenState] = useState(defaultOpen && !disabled);
  const [error, setError] = useState<string | null>(null);
  const [formatState, setFormatState] = useState<ColorPickerFormat>(defaultFormat);
  const [recentState, setRecentState] = useState<ColorValue[]>([]);
  // The colour being shown. It keeps its own hue, so dragging through grey or black does not lose it.
  const [local, setLocal] = useState<Local | null>(() => fromValue(value));
  const [seen, setSeen] = useState(value);
  // The last previewed colour, so a release commits exactly what was shown.
  const latest = useRef<Local | null>(local);
  const dragging = useRef(false);

  if (!sameColor(seen, value)) {
    setSeen(value);
    const keepsHue = value && local && sameColor(toValue(local), value);
    if (!dragging.current && !keepsHue) setLocal(fromValue(value));
  }

  const format = formatProp ?? formatState;
  const recent = recentProp ?? recentState;
  const editable = !disabled && !readOnly;
  const show = (next: Local) => {
    latest.current = next;
    setLocal(next);
  };

  const commit = (next: Local) => {
    dragging.current = false;
    show(next);
    const color = toValue(next);
    if (sameColor(color, value)) return;
    onValueCommit(color);
    const nextRecent = [color, ...recent.filter((item) => !sameColor(item, color))].slice(0, recentLimit);
    if (recentProp === undefined) setRecentState(nextRecent);
    onRecentChange?.(nextRecent);
  };

  const context: ColorPickerContextValue = {
    label,
    color: local,
    hex: local ? hsvToHex(local.hsv) : null,
    alpha: local ? local.alpha : null,
    preview: (next) => {
      if (!editable) return;
      dragging.current = true;
      show(next);
      onValueChange?.(toValue(next));
    },
    commit: (next) => editable && commit(next),
    release: () => {
      if (dragging.current && latest.current) commit(latest.current);
      dragging.current = false;
    },
    fallback: local ?? { hsv: { h: 0, s: 0, v: 1 }, alpha: 1 },
    format,
    setFormat: (next) => {
      if (formatProp === undefined) setFormatState(next);
      onFormatChange?.(next);
    },
    swatches: swatches.map(toSwatch).filter((swatch): swatch is ColorValue => swatch !== null),
    recent,
    open,
    setOpen: (next) => setOpenState(next && !disabled),
    error,
    setError,
    errorId: `${id}-error`,
    inputId: `${id}-input`,
    disabled,
    readOnly,
    editable,
    animated: motion,
    container,
    messages,
    triggerRef,
    rootRef,
  };

  return (
    <ColorPickerContext.Provider value={context}>
      <Popover.Root open={open} onOpenChange={(next) => context.setOpen(next)}>
        <div
          ref={mergeRefs(ref, rootRef)}
          role="group"
          aria-label={label}
          data-mixed={value === null || undefined}
          data-disabled={disabled || undefined}
          data-readonly={readOnly || undefined}
          data-invalid={error ? true : undefined}
          className={cn("group/color flex min-w-0 flex-wrap items-center", className)}
          {...props}
        >
          {children}
        </div>
      </Popover.Root>
    </ColorPickerContext.Provider>
  );
});
