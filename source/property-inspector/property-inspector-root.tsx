"use client";

import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";
import {
  type PropertyInspectorItem,
  type PropertyInspectorProps,
  PropertyInspectorContext,
  defaultMessages,
  selectionContext,
  usePropertyInspector,
} from "./property-inspector-state";
import { cn } from "@/lib/utils";

/**
 * Grouped properties for whatever the host has selected. With one item it shows that item's
 * values; with several, shared values as they are and differing ones as Mixed (part by part for
 * properties made of parts), and an edit applies to every selected item. The host owns the selection, values and history.
 */
/** Compact values for the variables every inspector control reads. Field text steps down to match the panel's labels. */
const compactDensity =
  "data-[density=compact]:[--uicoolkit-field-height:1.75rem] data-[density=compact]:[--uicoolkit-field-bg:color-mix(in_oklab,var(--muted),var(--foreground)_5%)] data-[density=compact]:[--uicoolkit-field-border:var(--input)] data-[density=compact]:[--uicoolkit-field-shadow:none] data-[density=compact]:[--uicoolkit-field-icon-bg:color-mix(in_oklab,var(--muted),var(--foreground)_5%)] data-[density=compact]:[--uicoolkit-field-icon-border:var(--input)] data-[density=compact]:[--uicoolkit-field-icon-width:1.75rem] data-[density=compact]:[&_input]:text-[13px] data-[density=compact]:[&_[role=combobox]]:text-[13px]";

function PropertyInspectorRoot<T extends PropertyInspectorItem>(
  { items, onCommit, onPreview, disabled = false, motion = true, labelPosition = "outside", density = "default", container, messages: messagesProp, className, children, ...props }: PropertyInspectorProps<T>,
  ref: React.ForwardedRef<HTMLElement>,
) {
  const messages = { ...defaultMessages, ...messagesProp };
  const context = selectionContext({ disabled, animated: motion, labelPosition, container, messages }, items as unknown as Record<string, unknown>[], onCommit, onPreview);

  return (
    <PropertyInspectorContext.Provider value={context}>
      <section
        ref={ref}
        aria-label={messages.label}
        data-empty={items.length === 0 || undefined}
        data-multiple={items.length > 1 || undefined}
        data-density={density === "compact" ? "compact" : undefined}
        className={cn("grid content-start gap-1 text-sm", compactDensity, className)}
        {...props}
      >
        {children}
      </section>
    </PropertyInspectorContext.Provider>
  );
}

export const PropertyInspector = forwardRef(PropertyInspectorRoot) as <T extends PropertyInspectorItem>(
  props: PropertyInspectorProps<T> & { ref?: React.Ref<HTMLElement> },
) => ReturnType<typeof PropertyInspectorRoot>;

type HeaderProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** The property that names one item, such as "name". */
  property?: string;
  /** Replace the title, given the selection count and the first item. */
  children?: (count: number, first: Record<string, unknown> | undefined) => ReactNode;
};

/** The selection's title: the item's name, or how many are selected. Hidden when nothing is selected. */
export const PropertyInspectorHeader = forwardRef<HTMLDivElement, HeaderProps>(function PropertyInspectorHeader(
  { property = "name", children, className, ...props },
  ref,
) {
  const { count, first, messages } = usePropertyInspector();
  if (count === 0) return null;
  return (
    // Starts at the fields' edge, like the group titles below it.
    <div ref={ref} aria-live="polite" className={cn("truncate pb-1 text-sm font-semibold", className)} {...props}>
      {children ? children(count, first) : count === 1 ? String(first?.[property] ?? "") : messages.multiple(count)}
    </div>
  );
});

type EmptyProps = ComponentPropsWithoutRef<"div"> & {
  /** Replace the icon above the text. */
  icon?: ReactNode;
};

/** Shown when nothing is selected: an icon with the text centred below it, like every empty state in the kit. */
export const PropertyInspectorEmpty = forwardRef<HTMLDivElement, EmptyProps>(function PropertyInspectorEmpty({ icon, className, children, ...props }, ref) {
  const { count, messages } = usePropertyInspector();
  if (count > 0) return null;
  return (
    <div ref={ref} className={cn("flex flex-col items-center justify-center gap-2.5 px-4 py-10 text-center text-sm text-muted-foreground", className)} {...props}>
      <span aria-hidden className="grid size-10 place-items-center rounded-full bg-muted [&_svg]:size-5">
        {icon ?? (
          // A pointer clicking a dashed selection: select something to inspect it.
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6V4a1 1 0 0 1 1-1h2M10 3h1M15 3h1a1 1 0 0 1 1 1v1M3 10v1M3 15v1a1 1 0 0 0 1 1h1" />
            <path d="m9.5 9.5 7.5 2.75-3.25 1.25L12.5 16.75Z" />
          </svg>
        )}
      </span>
      <p className="max-w-52 text-balance">{children ?? messages.empty}</p>
    </div>
  );
});
