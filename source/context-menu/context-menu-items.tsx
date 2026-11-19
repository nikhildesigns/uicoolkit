"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { ContextMenu as Base } from "@base-ui/react/context-menu";
import { cn } from "@/lib/utils";
import { useContextMenuContext } from "./context-menu-state";

export type ContextMenuItemProps = ComponentPropsWithoutRef<typeof Base.Item> & {
  variant?: "default" | "destructive";
};

/** An action. Choosing it closes the menu; the app performs the work in onClick. */
export const ContextMenuItem = forwardRef<HTMLDivElement, ContextMenuItemProps>(function ContextMenuItem(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <Base.Item
      ref={ref}
      data-variant={variant}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        variant === "destructive" &&
          "text-destructive data-[highlighted]:text-destructive [&_svg]:text-destructive",
        className,
      )}
      {...(props as ComponentPropsWithoutRef<typeof Base.Item>)}
    />
  );
});

export const ContextMenuGroup = Base.Group;

export const ContextMenuGroupLabel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof Base.GroupLabel>>(
  function ContextMenuGroupLabel({ className, ...props }, ref) {
    return (
      <Base.GroupLabel
        ref={ref}
        className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}
        {...(props as ComponentPropsWithoutRef<typeof Base.GroupLabel>)}
      />
    );
  },
);

export const ContextMenuSeparator = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof Base.Separator>>(
  function ContextMenuSeparator({ className, ...props }, ref) {
    return <Base.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...(props as ComponentPropsWithoutRef<typeof Base.Separator>)} />;
  },
);

/** A shortcut hint shown at the end of an item. It does not register the shortcut. */
export const ContextMenuShortcut = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function ContextMenuShortcut({ className, ...props }, ref) {
  return <span ref={ref} className={cn("ml-auto pl-4 text-xs tracking-widest text-muted-foreground", className)} {...props} />;
});

/** State of the nearest ContextMenu, for building your own parts. */
export function useContextMenu() {
  const { open, disabled } = useContextMenuContext("useContextMenu");
  return { open, disabled };
}
