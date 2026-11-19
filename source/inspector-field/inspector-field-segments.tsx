"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent, type ReactElement, type ReactNode, forwardRef, useEffect, useRef, useState } from "react";
import { InspectorFieldLock } from "./inspector-field-lock";
import { InspectorFieldValue } from "./inspector-field-parts";
import { mergeRefs, useInspectorField } from "./inspector-field-state";
import { cn } from "@/lib/utils";

/** One choice. With an icon, the segment shows only the icon and the label names it and fills its tooltip. */
export type InspectorFieldSegment<V extends string | boolean = string> = { value: V; label: string; icon?: ReactNode };

type TipProps = { label: string; children: ReactElement };

/** A tooltip naming an icon-only control, portalled into the row so it keeps the row's theme. */
function Tip({ label, children }: TipProps) {
  const field = useInspectorField();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal container={field.rootRef}>
        <Tooltip.Positioner side="top" sideOffset={6} positionMethod="fixed" className="z-50">
          <Tooltip.Popup
            className={cn(
              "rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md",
              field.animated &&
                "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none",
            )}
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

type HoverBox = { x: number; width: number; shown: boolean; instant: boolean };

/**
 * One hover box shared by a group's items, sliding to whichever item is under the pointer. It appears
 * in place (no slide in from the edge) and fades out when the pointer leaves or rests on a skipped item.
 */
function useSharedHover(skip: (item: HTMLElement) => boolean, animated: boolean, className?: string) {
  const [box, setBox] = useState<HoverBox>({ x: 0, width: 0, shown: false, instant: true });
  const hide = () => setBox((current) => (current.shown ? { ...current, shown: false } : current));
  const handlers = {
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;
      const item = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!item || !event.currentTarget.contains(item) || item.disabled || skip(item)) return hide();
      const x = item.offsetLeft;
      const width = item.offsetWidth;
      setBox((current) => (current.shown && current.x === x && current.width === width ? current : { x, width, shown: true, instant: !current.shown }));
    },
    onPointerLeave: hide,
  };
  const highlight = (
    <span
      aria-hidden
      data-slot="hover"
      className={cn(
        "pointer-events-none absolute inset-y-0.5 left-0 -z-20 rounded-md bg-foreground/10",
        animated && "transition-opacity duration-150 motion-reduce:transition-none",
        animated && !box.instant && "transition-[transform,width,opacity] ease-out",
        className,
      )}
      style={{ width: box.width, transform: `translateX(${box.x}px)`, opacity: box.shown ? 1 : 0 }}
    />
  );
  return { handlers, highlight };
}

type SegmentsProps<V extends string | boolean> = Omit<ComponentPropsWithoutRef<"div">, "onChange"> & {
  /** The committed choice, or null when a selection differs. The application owns it. */
  value: V | null;
  /** Two to five choices. */
  options: InspectorFieldSegment<V>[];
  /** Called when a different choice is made. */
  onCommit: (value: V) => void;
  /** Class for the highlight that slides to the chosen segment. */
  highlightClassName?: string;
  /** Class for each segment. The chosen one has data-selected. */
  segmentClassName?: string;
  /** Class for the hover box that slides between unchosen segments. */
  hoverClassName?: string;
};

/**
 * A built-in segmented choice with a highlight that slides to the chosen segment. Text segments stay
 * compact at the row's end; icon segments fill the control column in equal widths and name
 * themselves in a tooltip. It is a radio group: arrow keys move the choice, and the group is one tab stop.
 */
function SegmentsInner<V extends string | boolean>(
  { value, options, onCommit, highlightClassName, segmentClassName, hoverClassName, className, onKeyDown, onPointerMove, onPointerLeave, ...props }: SegmentsProps<V>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const field = useInspectorField();
  const group = useRef<HTMLDivElement | null>(null);
  // The chosen segment already has its knob, so the hover box skips it.
  const hover = useSharedHover((item) => item.hasAttribute("data-selected"), field.animated, hoverClassName);
  if (field.unavailable) return <InspectorFieldValue />;

  const icons = options.some((option) => option.icon);
  const mixed = field.mixed || value === null;
  const index = mixed ? -1 : options.findIndex((option) => option.value === value);
  const blocked = !field.editable || field.pending;
  const off = field.disabled || field.locked;
  const choose = (next: V) => {
    if (blocked || field.disabled) return;
    if (mixed || next !== value) onCommit(next);
  };

  return (
    <Tooltip.Provider delay={400}>
      <div
        ref={mergeRefs(ref, group)}
        role="radiogroup"
        id={field.controlId}
        aria-labelledby={field.labelId}
        aria-describedby={field.describedBy}
        aria-readonly={blocked || undefined}
        aria-disabled={off || undefined}
        data-disabled={off || undefined}
        data-icons={icons || undefined}
        data-slot="segments"
        className={cn(
          // A boxed track, the same as Color Picker's format switch: a border and muted fill, with the choice raised on it.
          "relative isolate grid h-[calc(var(--uicoolkit-field-height,2.5rem)-0.5rem)] shrink-0 grid-flow-col auto-cols-fr rounded-md border border-input bg-muted p-0.5 text-sm data-[disabled]:opacity-50 dark:bg-input/40",
          // Icons share the column; text keeps Off/On's compact size at the row's end.
          // Beside other controls (InspectorFieldControls) they take only the width left over.
          icons ? "w-full min-w-0 flex-1" : "w-28 justify-self-end",
          // The row's box already frames it, so only the chosen segment is drawn.
          field.inside && "border-transparent bg-transparent dark:bg-transparent",
          className,
        )}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
          if (event.defaultPrevented || !step) return;
          event.preventDefault();
          const next = Math.min(options.length - 1, Math.max(0, (index < 0 ? 0 : index) + step));
          choose(options[next].value);
          group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          hover.handlers.onPointerMove(event);
        }}
        // Entering an item shows the box at once, before the pointer moves again.
        onPointerOver={hover.handlers.onPointerMove}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          hover.handlers.onPointerLeave();
        }}
        {...props}
      >
        {hover.highlight}
        {index >= 0 && (
          <span
            aria-hidden
            className={cn(
              // A thin border keeps the chosen segment visible on the track in light themes, where the two are close.
              "absolute inset-y-0.5 left-0.5 -z-10 rounded-sm bg-background shadow-sm ring-1 ring-border",
              // Without the track behind it, the chosen segment takes the primary tint used for selections.
              field.inside && "bg-primary/10",
              field.animated && "transition-transform duration-200 ease-out motion-reduce:transition-none",
              highlightClassName,
            )}
            style={{ width: `calc((100% - 0.25rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
          />
        )}
        {options.map((option, position) => {
          const selected = position === index;
          const segment = (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.icon ? option.label : undefined}
              // One tab stop: the chosen segment, or the first when mixed.
              tabIndex={selected || (index < 0 && position === 0) ? 0 : -1}
              disabled={off}
              data-selected={selected || undefined}
              className={cn(
                "inline-flex min-w-0 items-center justify-center gap-1 rounded-sm text-muted-foreground outline-none transition-colors duration-150 select-none motion-reduce:transition-none [&_svg]:size-4",
                "focus-visible:bg-foreground/10 focus-visible:text-foreground data-selected:text-foreground",
                // The shared hover box sits behind it; the segment only brightens.
                "not-data-selected:enabled:hover:text-foreground",
                segmentClassName,
              )}
              onClick={() => choose(option.value)}
            >
              {option.icon ?? option.label}
              {/* Takes the segment's own text colour so it reads on any selected fill. */}
              {selected && <InspectorFieldLock aria-hidden className="size-3.5 text-current opacity-70" />}
            </button>
          );
          return option.icon && !off ? (
            <Tip key={String(option.value)} label={option.label}>
              {segment}
            </Tip>
          ) : (
            segment
          );
        })}
      </div>
    </Tooltip.Provider>
  );
}

export const InspectorFieldSegments = forwardRef(SegmentsInner) as <V extends string | boolean>(
  props: SegmentsProps<V> & { ref?: React.Ref<HTMLDivElement> },
) => ReactElement | null;

type ToggleButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children" | "onChange"> & {
  /** Whether it is on, or null when a selection differs. The application owns it. */
  pressed: boolean | null;
  /** Names the button and fills its tooltip, such as "Wrap". */
  label: string;
  icon: ReactNode;
  /** Called with the new state; a Mixed button turns on. */
  onCommit: (pressed: boolean) => void;
};

/**
 * A built-in on/off button with an icon, such as Wrap or Flip horizontal. It can be a row's whole
 * control, or sit beside another control inside InspectorFieldControls.
 */
export const InspectorFieldToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function InspectorFieldToggleButton(
  { pressed, label, icon, onCommit, className, onClick, ...props },
  ref,
) {
  const field = useInspectorField();
  const mixed = field.mixed || pressed === null;
  const blocked = !field.editable || field.pending;
  const off = field.disabled || field.locked;
  const button = (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={mixed ? "mixed" : !!pressed}
      aria-describedby={field.describedBy}
      disabled={off || field.unavailable}
      data-slot="toggle-button"
      className={cn(
        // Off looks like Boolean's track; on looks like its chosen side, a raised knob with a thin border.
        "grid size-8 shrink-0 place-items-center justify-self-end rounded-md bg-muted text-muted-foreground outline-none transition-[color,background-color,box-shadow] duration-150 [&_svg]:size-4 motion-reduce:transition-none",
        "hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground disabled:opacity-50",
        // The same soft hover box as segments and actions, inset like a segment in its track; on, the knob is enough.
        "relative before:pointer-events-none before:absolute before:inset-0.5 before:rounded-sm before:bg-foreground/10 before:opacity-0 before:transition-opacity before:duration-150 motion-reduce:before:transition-none",
        "not-aria-pressed:enabled:hover:before:opacity-100",
        "aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-border",
        // Mixed: a selection holds both, so the knob is outlined but not raised.
        "aria-[pressed=mixed]:outline-1 aria-[pressed=mixed]:-outline-offset-1 aria-[pressed=mixed]:outline-dashed aria-[pressed=mixed]:outline-border",
        // The row's box already frames it, so only the on state is drawn, in the primary tint Boolean uses there.
        field.inside && "bg-transparent aria-pressed:bg-primary/10 aria-pressed:shadow-none aria-pressed:ring-0",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || blocked || off) return;
        onCommit(mixed ? true : !pressed);
      }}
      {...props}
    >
      {icon}
    </button>
  );
  return off ? button : (
    <Tooltip.Provider delay={400}>
      <Tip label={label}>{button}</Tip>
    </Tooltip.Provider>
  );
});

/**
 * Puts several controls in the control column side by side, such as Direction segments with a Wrap
 * button, or two flip buttons. Segments with icons take the remaining width.
 */
export const InspectorFieldControls = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function InspectorFieldControls({ className, ...props }, ref) {
  const field = useInspectorField();
  return (
    <div
      ref={ref}
      data-slot="controls"
      className={cn("flex h-[var(--uicoolkit-field-height,2.5rem)] min-w-0 items-center justify-end gap-1.5", field.inside ? "pr-1 pl-2" : "", className)}
      {...props}
    />
  );
});

type ActionsProps = ComponentPropsWithoutRef<"div"> & {
  /** Names the group for assistive technology. Defaults to the row's label. */
  label?: string;
  /** Class for the hover box that slides between actions. */
  hoverClassName?: string;
};

/**
 * A joined group of one-shot action buttons, such as Rotate 90° and the flips. Nothing stays pressed:
 * each press reports one action. It is a toolbar, so Tab reaches it once and arrow keys move between buttons.
 */
export const InspectorFieldActions = forwardRef<HTMLDivElement, ActionsProps>(function InspectorFieldActions({ label, hoverClassName, className, onKeyDown, onPointerMove, onPointerLeave, children, ...props }, ref) {
  const field = useInspectorField();
  const group = useRef<HTMLDivElement | null>(null);
  const hover = useSharedHover(() => false, field.animated, hoverClassName);
  // One tab stop: keep it on an enabled button, the first one until arrow keys move it.
  useEffect(() => {
    const buttons = [...(group.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const enabled = buttons.filter((button) => !button.disabled);
    if (enabled.some((button) => button.tabIndex === 0)) return;
    for (const button of buttons) button.tabIndex = button === enabled[0] ? 0 : -1;
  });
  return (
    <Tooltip.Provider delay={400}>
      <div
        ref={mergeRefs(ref, group)}
        role="toolbar"
        aria-label={label ?? field.label}
        aria-describedby={field.describedBy}
        data-slot="actions"
        className={cn(
          "relative isolate flex h-[calc(var(--uicoolkit-field-height,2.5rem)-0.5rem)] w-full min-w-0 items-stretch gap-0.5 rounded-lg bg-muted p-0.5",
          // The row's box already frames it.
          field.inside && "bg-transparent",
          className,
        )}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
          if (event.defaultPrevented || !step) return;
          const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          if (index < 0) return;
          event.preventDefault();
          const next = buttons[(index + step + buttons.length) % buttons.length];
          for (const button of buttons) button.tabIndex = button === next ? 0 : -1;
          next.focus();
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          hover.handlers.onPointerMove(event);
        }}
        // Entering an item shows the box at once, before the pointer moves again.
        onPointerOver={hover.handlers.onPointerMove}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          hover.handlers.onPointerLeave();
        }}
        {...props}
      >
        {hover.highlight}
        {children}
      </div>
    </Tooltip.Provider>
  );
});

type ActionButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  /** Names the action and fills its tooltip, such as "Flip horizontal". */
  label: string;
  icon: ReactNode;
  /** Called once per press. */
  onAction: () => void;
  /** Shortcut text shown in the tooltip, such as "Shift+H". Your app binds the key. */
  shortcut?: string;
};

/** One action in InspectorFieldActions. It is off while the row is locked, read-only, pending or disabled. */
export const InspectorFieldActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function InspectorFieldActionButton(
  { label, icon, onAction, shortcut, className, onClick, disabled, tabIndex, ...props },
  ref,
) {
  const field = useInspectorField();
  const off = !!disabled || !field.editable || field.pending;
  const button = (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-keyshortcuts={shortcut}
      disabled={off}
      // InspectorFieldActions gives one button the tab stop.
      tabIndex={tabIndex ?? -1}
      data-slot="action"
      className={cn(
        // A press pushes the key in (flat, no shadow) rather than shrinking it, so taps stay steady.
        "grid min-w-8 flex-1 place-items-center rounded-md text-muted-foreground outline-none transition-[color,background-color,box-shadow] duration-100 ease-out select-none [&_svg]:size-4 motion-reduce:transition-none",
        // The group's shared hover box sits behind it, the same as segments; a press deepens it.
        "hover:text-foreground active:bg-foreground/10 active:text-foreground active:duration-0 focus-visible:bg-foreground/10 focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !off) onAction();
      }}
      {...props}
    >
      {icon}
    </button>
  );
  return off ? button : <Tip label={shortcut ? `${label}  ${shortcut}` : label}>{button}</Tip>;
});
