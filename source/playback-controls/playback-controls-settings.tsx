"use client";

import { Popover } from "@base-ui/react/popover";
import { type ComponentPropsWithoutRef, forwardRef, useRef, useSyncExternalStore } from "react";
import { InspectorField, InspectorFieldLabel, InspectorFieldSegments, InspectorFieldSelect, InspectorFieldToggle } from "@/components/ui/inspector-field";
import { PlaybackButton, PlaybackLoopButton, PlaybackPlayButton, PlaybackRestartButton, PlaybackSpeed, PlaybackStepButton, line, speedChoices } from "./playback-controls-buttons";
import { usePlaybackControls } from "./playback-controls-state";
import { PlaybackVolume, PlaybackVolumeRow } from "./playback-controls-volume";
import { cn } from "@/lib/utils";

const phoneQuery = "(max-width: 639px)";
const subscribe = (notify: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(phoneQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
/** Phones get a bottom sheet. The server renders the desktop popup, then adapts. */
const usePhone = () => useSyncExternalStore(subscribe, () => typeof window.matchMedia === "function" && window.matchMedia(phoneQuery).matches, () => false);

const settingsIcon = line("M12.25 8a4.25 4.25 0 1 1-8.5 0 4.25 4.25 0 0 1 8.5 0ZM9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM8 1.75v2M8 12.25v2M1.75 8h2M12.25 8h2M3.6 3.6 5 5M11 11l1.4 1.4M3.6 12.4 5 11M11 5l1.4-1.4");
const closeIcon = line("m4 4 8 8M12 4l-8 8");
const sheetStyle = { position: "fixed", top: "auto", bottom: 0, left: 0, right: 0, width: "100%", transform: "none" } as const;

/** Volume, Loop and Speed as rows. Only the ones your app passes appear. */
function SettingsRows() {
  const { loop, speed, speeds, disabled, container, messages, setLoop, setSpeed } = usePlaybackControls();
  const options = speed === undefined ? [] : speedChoices(speed, speeds).map((choice) => ({ value: String(choice), label: messages.speedValue(choice) }));
  return (
    <div className="grid gap-1">
      <PlaybackVolumeRow />
      {loop !== undefined && (
        <InspectorField label={messages.loop} disabled={disabled}>
          <InspectorFieldLabel />
          <InspectorFieldToggle checked={loop} onCommit={setLoop} />
        </InspectorField>
      )}
      {speed !== undefined && (
        <InspectorField label={messages.speed} disabled={disabled}>
          <InspectorFieldLabel />
          {options.length <= 5 ? (
            <InspectorFieldSegments className="w-44 justify-self-end" value={String(speed)} options={options} onCommit={(next) => setSpeed(Number(next))} />
          ) : (
            <InspectorFieldSelect value={String(speed)} options={options} container={container} positionMethod="fixed" onCommit={(next) => setSpeed(Number(next))} />
          )}
        </InspectorField>
      )}
    </div>
  );
}

type SettingsProps = Omit<ComponentPropsWithoutRef<"button">, "children" | "aria-label" | "aria-pressed">;

/** A settings button that holds Volume, Loop and Speed. It opens a popup, or a bottom sheet on phones. */
export const PlaybackSettings = forwardRef<HTMLButtonElement, SettingsProps>(function PlaybackSettings({ className, ...props }, ref) {
  const { volumeState, loop, speed, disabled, container, messages } = usePlaybackControls();
  const phone = usePhone();
  const popup = useRef<HTMLDivElement>(null);
  if (!volumeState && loop === undefined && speed === undefined) return null;
  return (
    <Popover.Root modal={phone}>
      <Popover.Trigger render={<PlaybackButton ref={ref} data-slot="playback-settings" label={messages.settings} icon={settingsIcon} disabled={disabled} className={cn("data-[popup-open]:bg-foreground/10 data-[popup-open]:text-foreground", className)} {...props} />} />
      <Popover.Portal container={container ?? undefined}>
        {phone && <Popover.Backdrop className="fixed inset-0 z-50 bg-black/40" />}
        <Popover.Positioner side="top" align="end" sideOffset={6} positionMethod="fixed" className="z-50" style={phone ? sheetStyle : undefined}>
          <Popover.Popup
            ref={popup}
            initialFocus={phone ? popup : undefined}
            data-slot="playback-settings-popup"
            className={cn(
              "grid gap-2 border border-border bg-popover text-popover-foreground shadow-md outline-none transition-[transform,opacity] duration-150 ease-out motion-reduce:transition-none",
              phone
                ? "w-full rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full"
                : "w-80 max-w-[calc(100vw-2rem)] origin-[var(--transform-origin)] rounded-md p-3 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            )}
          >
            <div className="flex items-center justify-between">
              <Popover.Title className="text-sm font-medium">{messages.settings}</Popover.Title>
              <Popover.Close render={<PlaybackButton label={messages.close} icon={closeIcon} />} />
            </div>
            <SettingsRows />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
});

const hiddenWhenNarrow = "max-sm:hidden @max-xs/playback:hidden";
// 48px targets on touch and when narrow. They only shrink if the row cannot fit five of them.
const largeTarget = "max-w-full justify-self-center pointer-coarse:size-12 max-sm:size-12 max-sm:[&_svg]:size-5 @max-xs/playback:size-12 @max-xs/playback:[&_svg]:size-5";

/**
 * The button row. Wide: Play first, then Restart, Rewind and Fast forward, with Volume, Loop and Speed
 * at the end. On phones and in narrow spaces: Restart, Rewind, Play in the center, Fast forward and
 * Settings as evenly spaced 48px buttons, with Volume, Loop and Speed inside Settings.
 */
export const PlaybackTransport = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function PlaybackTransport({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="playback-transport"
      className={cn(
        "flex items-center gap-1",
        "max-sm:grid max-sm:grid-cols-5 max-sm:gap-0 max-sm:*:row-start-1",
        "@max-xs/playback:grid @max-xs/playback:grid-cols-5 @max-xs/playback:gap-0 @max-xs/playback:*:row-start-1",
        className,
      )}
      {...props}
    >
      <PlaybackPlayButton className={cn(largeTarget, "max-sm:col-start-3 @max-xs/playback:col-start-3")} />
      <PlaybackRestartButton className={cn(largeTarget, "max-sm:col-start-1 @max-xs/playback:col-start-1")} />
      <PlaybackStepButton direction="back" className={cn(largeTarget, "max-sm:col-start-2 @max-xs/playback:col-start-2")} />
      <PlaybackStepButton direction="forward" className={cn(largeTarget, "max-sm:col-start-4 @max-xs/playback:col-start-4")} />
      <span aria-hidden className={cn("flex-1", hiddenWhenNarrow)} />
      <PlaybackVolume className={hiddenWhenNarrow} />
      <PlaybackLoopButton className={hiddenWhenNarrow} />
      <PlaybackSpeed className={hiddenWhenNarrow} />
      <PlaybackSettings className={cn(largeTarget, "hidden max-sm:col-start-5 max-sm:inline-flex @max-xs/playback:col-start-5 @max-xs/playback:inline-flex")} />
    </div>
  );
});

/** Volume, Loop and Speed in a row. On phones and in narrow spaces they fold into Settings. Pass children to choose what shows in the row. */
export const PlaybackOptions = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function PlaybackOptions({ className, children, ...props }, ref) {
  return (
    <div ref={ref} data-slot="playback-options" className={cn("ml-auto flex shrink-0 items-center", className)} {...props}>
      <div className={cn("flex items-center gap-1", hiddenWhenNarrow)}>
        {children ?? (
          <>
            <PlaybackVolume />
            <PlaybackLoopButton />
            <PlaybackSpeed />
          </>
        )}
      </div>
      <PlaybackSettings className="hidden max-sm:inline-flex @max-xs/playback:inline-flex" />
    </div>
  );
});
