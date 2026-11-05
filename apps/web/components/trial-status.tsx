"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock3, ArrowRight, ShieldCheck } from "lucide-react";
import type {
  Workspace,
  TrialSummary,
  PublicConfig,
} from "@reviesnest/contracts";
import { buttonVariants } from "@/components/ui/button";
export function trialLabel(trial: TrialSummary) {
  return trial.status === "ACTIVE"
    ? `${trial.daysRemaining} ${trial.daysRemaining === 1 ? "day" : "days"} left in your trial`
    : trial.status === "EXPIRED"
      ? "Your trial has ended"
      : trial.status === "EXHAUSTED"
        ? "Trial generation allowance used"
        : "No trial available for this workspace";
}
export function TrialStatus({
  workspace,
  compact = false,
}: {
  workspace: Workspace;
  compact?: boolean;
}) {
  const { trial } = workspace;
  const router = useRouter();
  useEffect(() => {
    if (trial.status !== "ACTIVE") return;
    const timer = window.setInterval(() => router.refresh(), 60000);
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, trial.status]);
  return (
    <section
      aria-label="Your trial status"
      className={`mb-6 rounded-lg border ${trial.status === "ACTIVE" ? "border-primary/25 bg-accent/40" : "border-amber-700/25 bg-card"} ${compact ? "p-4" : "p-5"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <Clock3 className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">{trialLabel(trial)}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {trial.status === "UNAVAILABLE"
                ? "A new sign-in or business-name change does not create another trial."
                : `${trial.used} of ${trial.allowance} trial generations used · ${trial.remaining} remaining.`}{" "}
              No automatic charge.
            </p>
            {trial.expiresAt && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Ends{" "}
                {new Date(trial.expiresAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "Asia/Kolkata",
                })}{" "}
                IST · Server-tracked
              </p>
            )}
          </div>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
        >
          {workspace.onboarding.businessSaved && workspace.onboarding.qrSaved
            ? "View setup"
            : "Continue setup"}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {!compact && (
        <p className="mt-4 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
          Business details and appearance drafts remain editable. Google review
          sync depends on your connection; AI generation is not enabled yet.{" "}
          <Link
            href="/pricing"
            className="font-medium text-primary underline underline-offset-4"
          >
            See plans and availability.
          </Link>
        </p>
      )}
    </section>
  );
}
export function RealPlanPage({
  workspace,
  config,
  offerAvailable,
}: {
  workspace: Workspace | null;
  config: PublicConfig;
  offerAvailable: boolean;
}) {
  return (
    <>
      <div className="mb-7">
        <p className="market-eyebrow">SIMPLE AND TRANSPARENT</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Plan & billing
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your actual trial dates and usage. Manual payments will be available
          later.
        </p>
      </div>
      {workspace ? (
        <TrialStatus workspace={workspace} />
      ) : (
        <p role="status" className="mb-6 rounded-lg border bg-card p-5 text-sm">
          No active workspace is available for this account.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <ShieldCheck className="size-5 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">You’re in control</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The trial starts once, at first workspace creation. Signing out,
            renaming a business or updating a draft does not extend it.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            When it expires, trial-controlled generation stops. We will not
            silently start a paid subscription or charge you.
          </p>
        </section>
        <section className="rounded-lg border border-primary/30 bg-card p-6">
          <p className="text-sm font-semibold">Basic · Proposed offer</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight">
            ₹{config.priceMonthlyInr}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              / month
            </span>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            1 Google Business Profile · {config.paidAiAllowance} AI
            generations/month when integrations launch.
          </p>
          <Link
            href="/pricing"
            className={buttonVariants({
              variant: "outline",
              className: "mt-6",
            })}
          >
            View offer & availability
          </Link>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Payments are not connected. No AutoPay or recurring mandate.
            {!offerAvailable
              ? " Provisional pricing shown while the pricing service is unavailable."
              : ""}
          </p>
        </section>
      </div>
      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Payment history</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          No payments are available. Receipts will appear after verified
          one-time checkout is implemented.
        </p>
      </section>
    </>
  );
}
