"use client";

import { useId } from "react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";

export type BillingPeriod = "monthly" | "yearly";
export type PlanSelection = { planId: string; period: BillingPeriod };
export type PricingPlan = {
  id: string;
  name: string;
  /** Prices for one month and one full year in major currency units. */
  monthlyPrice: number;
  annualPrice: number;
  features: readonly string[];
  featured?: boolean;
};

export function BillingPeriodControl({ value, onChange, motion = true }: {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  motion?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="relative mx-auto grid w-fit grid-cols-2 rounded-full border border-border bg-background p-1">
      <legend className="sr-only">Billing period</legend>
      <span aria-hidden="true" className={cn(
        "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-primary shadow-sm",
        value === "yearly" && "translate-x-full", motion && "motion-safe:transition-transform motion-safe:duration-200",
      )} />
      {(["monthly", "yearly"] as const).map(period => (
        <label key={period} className={cn("relative cursor-pointer rounded-full px-4 py-1.5 text-center text-sm font-medium has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
          value === period ? "text-primary-foreground" : "text-muted-foreground")}>
          <input className="sr-only" name={name} type="radio" value={period}
            checked={value === period} onChange={() => onChange(period)} />
          {period === "monthly" ? "Monthly" : "Yearly"}
        </label>
      ))}
    </fieldset>
  );
}

export type PlanSwitcherProps = {
  plans: readonly PricingPlan[];
  period: BillingPeriod;
  onPeriodChange: (period: BillingPeriod) => void;
  currentPlan?: PlanSelection;
  onChoose: (selection: PlanSelection) => void;
  currency?: string;
  locale?: string;
  motion?: boolean;
  className?: string;
};

export function PlanSwitcher({ plans, period, onPeriodChange, currentPlan, onChoose,
  currency = "USD", locale = "en-US", motion = true, className }: PlanSwitcherProps) {
  const format = { style: "currency", currency, trailingZeroDisplay: "stripIfInteger" } as const;
  const money = new Intl.NumberFormat(locale, format);
  const currencyScale = 10 ** (money.resolvedOptions().maximumFractionDigits ?? 2);
  const yearly = period === "yearly";
  const summary = plans.map(plan => {
    const price = yearly ? plan.annualPrice : plan.monthlyPrice;
    return plan.name + " " + money.format(price) + (yearly ? " per year" : " per month");
  }).join(", ");

  return (
    <section aria-label="Compare plans" className={cn("@container w-full max-w-xl text-foreground", className)}>
      <BillingPeriodControl value={period} onChange={onPeriodChange} motion={motion} />
      <div role="status" aria-atomic="true" className="sr-only">{summary}</div>
      <div className="mt-4 grid grid-cols-1 gap-3 @min-[26rem]:grid-cols-2">
        {plans.map(plan => {
          const current = plan.id === currentPlan?.planId;
          const active = current && period === currentPlan.period;
          const monthly = yearly ? plan.annualPrice / 12 : plan.monthlyPrice;
          const savings = (Math.round(plan.monthlyPrice * currencyScale) * 12 - Math.round(plan.annualPrice * currencyScale)) / currencyScale;
          const action = active ? "Current plan" : current ? "Switch to " + period : "Choose " + plan.name;
          return (
            <article key={plan.id} aria-label={plan.name} data-featured={plan.featured || undefined} className={cn(
              "flex min-w-0 flex-col rounded-[calc(var(--radius,0.625rem)+6px)] border bg-background p-4 shadow-sm",
              plan.featured ? "border-primary/65 bg-linear-to-b from-primary/10 to-transparent to-40%" : "border-border",
            )}>
              <div className="flex flex-wrap items-baseline justify-between gap-1.5">
                <h3 className={cn("text-base font-semibold", plan.featured && "text-[color-mix(in_oklab,var(--primary)_50%,var(--foreground))]")}>{plan.name}</h3>
                {current && !active && <span className="text-xs text-muted-foreground">Current plan</span>}
              </div>
              <p className="mt-2 flex flex-wrap items-baseline gap-1">
                <NumberTicker value={monthly} format={format} locale={locale} motion={motion} duration={340} className="text-3xl font-semibold tracking-tight" />
                <span className="text-sm text-muted-foreground">/mo</span>
              </p>
              <div className="mt-1 flex min-h-10 flex-wrap content-start items-baseline gap-x-2 gap-y-1 text-xs leading-5 text-muted-foreground">
                <p>{yearly ? money.format(plan.annualPrice) + " billed yearly" : "Billed monthly"}</p>
                {yearly && savings > 0 && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold leading-4 text-[color-mix(in_oklab,var(--primary)_35%,var(--foreground))]">
                    Save {money.format(savings)}/year
                  </span>
                )}
              </div>
              <ul className="mb-4 mt-2 list-disc space-y-1 border-t border-border pt-3 pl-4 text-sm leading-5 marker:text-muted-foreground">
                {plan.features.map(feature => <li key={feature}>{feature}</li>)}
              </ul>
              <button type="button" aria-disabled={active || undefined} onClick={() => { if (!active) onChoose({ planId: plan.id, period }); }}
                className={cn("mt-auto w-full rounded-[var(--radius,0.625rem)] px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active && "bg-muted text-muted-foreground",
                  !active && "cursor-pointer shadow-sm",
                  !active && (plan.featured
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground inset-ring inset-ring-border hover:bg-foreground/10"))}>
                {action}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
