"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

export type WorkspaceSetup = {
  step: 0 | 1 | 2 | 3;
  workspaceName: string;
  inviteEmail: string;
  startingPoint: "blank" | "template";
};

export const emptyWorkspaceSetup: WorkspaceSetup = {
  step: 0, workspaceName: "", inviteEmail: "", startingPoint: "blank",
};

const titles = ["Name your workspace", "Invite a teammate", "Pick a starting point", "Your workspace is ready"];
const choices = [
  { value: "blank", label: "Blank workspace" },
  { value: "template", label: "Use a template" },
] as const;
const fieldStyle = "mt-2 block w-full rounded-[var(--radius,0.625rem)] border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary aria-invalid:border-destructive";
const buttonStyle = "rounded-[var(--radius,0.625rem)] px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const primaryButton = cn(buttonStyle, "bg-primary text-primary-foreground");
const quietButton = cn(buttonStyle, "text-muted-foreground hover:bg-muted hover:text-foreground");

type Props = {
  value: WorkspaceSetup;
  onChange: (value: WorkspaceSetup) => void;
  onComplete?: (value: WorkspaceSetup) => void;
  onReset?: () => void;
  motion?: boolean;
  className?: string;
};

export function OnboardingSteps({ value, onChange, onComplete, onReset, motion = true, className }: Props) {
  const { step, workspaceName, inviteEmail, startingPoint } = value;
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const previousStep = useRef(step);
  const [error, setError] = useState("");
  const done = step === 3;

  useEffect(() => {
    const previous = previousStep.current;
    previousStep.current = step;
    if (previous === step) return;
    heading.current?.focus({ preventScroll: true });
    if (!motion || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const animation = body.current?.animate?.([
      { opacity: 0, transform: "translateX(" + (previous < step ? 8 : -8) + "px)" },
      { opacity: 1, transform: "translateX(0)" },
    ], { duration: 160, easing: "ease-out" });
    return () => animation?.cancel();
  }, [step, motion]);

  function update(next: WorkspaceSetup) {
    setError("");
    onChange(next);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const message = step === 0 && !workspaceName.trim() ? "Enter a workspace name."
      : step === 1 && field.current?.validity.typeMismatch ? "Enter a valid email address or skip this step." : "";
    if (message) {
      setError(message);
      field.current?.focus();
      return;
    }
    const next: WorkspaceSetup = { ...value, workspaceName: workspaceName.trim(), inviteEmail: inviteEmail.trim(), step: step === 0 ? 1 : step === 1 ? 2 : 3 };
    update(next);
    if (next.step === 3) onComplete?.(next);
  }

  return (
    <section aria-labelledby={id} className={cn("w-full max-w-sm rounded-[calc(var(--radius,0.625rem)+6px)] border border-border bg-background p-5 text-left text-foreground shadow-sm", className)}>
      <ol aria-label="Setup progress" className="flex gap-1.5">
        {titles.slice(0, 3).map((title, index) => (
          <li key={title} aria-current={index === step ? "step" : undefined} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span aria-hidden="true" style={{ width: index < step ? "100%" : index === step ? "50%" : "0%" }}
              className={cn("block h-full rounded-full bg-primary", motion && "motion-safe:transition-[width] motion-safe:duration-150")} />
            <span className="sr-only">{title}{index < step && ", complete"}</span>
          </li>
        ))}
      </ol>
      <div ref={body} className="mt-5">
        <p className="text-xs font-medium text-muted-foreground">{done ? "Setup complete" : `Step ${step + 1} of 3${step === 1 ? " · Optional" : ""}`}</p>
        <h3 id={id} ref={heading} tabIndex={-1} className="mt-1 text-xl font-semibold tracking-tight outline-none">{titles[step]}</h3>
        {done ? <>
          <dl className="my-5 grid gap-3 text-sm">
            {[
              ["Workspace", workspaceName], ["Starting point", startingPoint === "blank" ? "Blank workspace" : "Template"],
              ["Teammate", inviteEmail || "Skipped"],
            ].map(([label, text]) => <div key={label} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 text-right font-medium [overflow-wrap:anywhere]">{text}</dd>
            </div>)}
          </dl>
          <button type="button" className={primaryButton} onClick={() => { update({ ...emptyWorkspaceSetup }); onReset?.(); }}>Start over</button>
        </> : (
          <form noValidate onSubmit={submit} className="mt-5">
            {step < 2 ? (
              <div key={step}>
                <label htmlFor={id + "-input"} className="text-sm font-medium">{step === 0 ? "Workspace name" : "Teammate email"}</label>
                <input id={id + "-input"} ref={field} type={step === 0 ? "text" : "email"} required={step === 0}
                  autoComplete="off" placeholder={step === 0 ? "e.g. Design studio" : "teammate@example.com"}
                  aria-invalid={error ? true : undefined} aria-describedby={error ? id + "-error" : undefined}
                  value={step === 0 ? workspaceName : inviteEmail} className={fieldStyle}
                  onChange={event => update(step === 0 ? { ...value, workspaceName: event.target.value } : { ...value, inviteEmail: event.target.value })} />
                {error && <p role="alert" id={id + "-error"} className="mt-2 text-sm text-destructive">{error}</p>}
              </div>
            ) : (
              <fieldset className="grid gap-2">
                <legend className="sr-only">Starting point</legend>
                {choices.map(choice => (
                  <label key={choice.value} className="flex cursor-pointer items-center gap-3 rounded-[var(--radius,0.625rem)] border border-input px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/10">
                    <input type="radio" name={id + "-start"} value={choice.value} checked={startingPoint === choice.value}
                      className="size-4 accent-primary" onChange={() => update({ ...value, startingPoint: choice.value })} />
                    {choice.label}
                  </label>
                ))}
              </fieldset>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-1">
              {step > 0 && <button type="button" className={quietButton} onClick={() => update({ ...value, step: step === 2 ? 1 : 0 })}>Back</button>}
              <div className="ml-auto flex flex-wrap items-center gap-1">
                {step === 1 && <button type="button" className={quietButton} onClick={() => update({ ...value, inviteEmail: "", step: 2 })}>Skip for now</button>}
                <button className={primaryButton} type="submit">{step === 2 ? "Finish" : "Continue"}</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
