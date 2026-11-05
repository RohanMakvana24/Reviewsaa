"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Store,
  MessageSquareText,
  MapPin,
  QrCode,
  Star,
} from "lucide-react";
import type { GoogleBusinessState } from "@reviesnest/contracts";
import { GoogleConnectionPanel } from "@/components/google-business-panel";
import { workspaceSchema, type Workspace } from "@reviesnest/contracts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrialStatus } from "@/components/trial-status";
import { cn } from "@/lib/utils";
const steps = [
  { key: "business", title: "Your business", icon: Store },
  { key: "google", title: "Connect Google", icon: MessageSquareText },
  { key: "location", title: "Choose profile", icon: MapPin },
  { key: "qr", title: "Page appearance", icon: QrCode },
] as const;
export function OnboardingWizard({
  initial,
  csrfToken,
  googleState,
}: {
  initial: Workspace;
  csrfToken: string;
  googleState: GoogleBusinessState;
}) {
  const [workspace, setWorkspace] = useState(initial),
    [step, setStep] = useState(0),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("");
  const [googleNotice, setGoogleNotice] = useState("");
  useEffect(() => {
    const messages: Record<string, string> = {
      connected:
        "Google authorization saved. Choose your business profile to continue.",
      cancelled: "Google authorization was cancelled. You can try again.",
      failed:
        "Google connection could not be completed. Check permissions and retry.",
      invalid_state:
        "The connection request expired or could not be verified. Start again.",
      reconnect: "Please reconnect your Google account.",
      account_mismatch:
        "Disconnect the existing Google account before connecting a different account.",
    };
    setGoogleNotice(
      messages[
        new URLSearchParams(window.location.search).get("google") || ""
      ] || "",
    );
  }, []);
  const [name, setName] = useState(
      initial.onboarding.business?.name || initial.organization.name,
    ),
    [category, setCategory] = useState(
      initial.onboarding.business?.category || "",
    ),
    [city, setCity] = useState(initial.onboarding.business?.city || ""),
    [phone, setPhone] = useState(initial.onboarding.business?.phone || ""),
    [greeting, setGreeting] = useState(
      initial.onboarding.qr?.greeting ||
        "Thanks for visiting. We’d love to hear about your experience.",
    ),
    [accentColor, setAccentColor] = useState(
      initial.onboarding.qr?.accentColor || "#12654f",
    );
  const router = useRouter();
  useEffect(() => {
    setWorkspace(initial);
  }, [initial]);
  async function save(body: Record<string, string>, nextStep?: number) {
    setPending(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch(
        `/api/organizations/${encodeURIComponent(workspace.organization.id)}/onboarding`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(body),
        },
      );
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(
          data?.error === "BUSINESS_DETAILS_REQUIRED"
            ? "Save your business details before setting up the page."
            : response.status === 400
              ? "Please check all fields and try again."
              : response.status === 403 || response.status === 404
                ? "This workspace is not available to your account."
                : "Your changes could not be saved. Please retry.",
        );
        return;
      }
      const updated = workspaceSchema.parse(await response.json());
      setWorkspace(updated);
      setSaved(
        body.step === "business"
          ? "Business details saved."
          : "Page appearance draft saved. Nothing has been published.",
      );
      if (nextStep !== undefined) setStep(nextStep);
      router.refresh();
    } catch {
      setError(
        "Your changes could not be saved. Check your connection and retry.",
      );
    } finally {
      setPending(false);
    }
  }
  function go(index: number) {
    setStep(index);
    setError("");
    setSaved("");
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Star className="size-4" />
          </span>
          ReviesNest
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground"
        >
          Go to dashboard
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="mb-8">
        <p className="market-eyebrow">LET’S MAKE THIS YOURS</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          A workspace for your place.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Save your business details, authorize an eligible Google profile, and
          choose your page’s look. Public QR publishing is a later step.
        </p>
      </div>
      <TrialStatus workspace={workspace} compact />
      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="Setup steps"
          className="grid grid-cols-2 gap-2 lg:grid-cols-1"
        >
          {steps.map(({ key, title, icon: Icon }, index) => {
            const state = workspace.onboarding.steps.find(
              (s) => s.key === key,
            )?.status;
            return (
              <button
                key={key}
                type="button"
                aria-current={step === index ? "step" : undefined}
                onClick={() => go(index)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-4 text-left text-xs transition-colors",
                  step === index
                    ? "border-primary/30 bg-accent"
                    : "bg-card hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-md border",
                    state === "complete"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background",
                  )}
                >
                  {state === "complete" ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {state === "complete"
                      ? "Saved"
                      : state === "blocked"
                        ? "Action required"
                        : "Ready to set up"}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
        <section
          aria-label={steps[step].title}
          className="min-w-0 rounded-xl border bg-card p-5 sm:p-8"
        >
          {step === 0 ? (
            <>
              <p className="text-xs font-medium text-primary">
                STEP 01 · AVAILABLE NOW
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Tell us about your business.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                These details belong to your workspace. They do not change a
                Google Business Profile.
              </p>
              <form
                className="mt-7 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void save(
                    { step: "business", name, category, city, phone },
                    1,
                  );
                }}
              >
                <div className="space-y-2">
                  <label
                    htmlFor="business-name"
                    className="text-xs font-medium"
                  >
                    Business name
                  </label>
                  <Input
                    id="business-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    autoComplete="organization"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="business-category"
                      className="text-xs font-medium"
                    >
                      Business category
                    </label>
                    <Input
                      id="business-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      maxLength={100}
                      placeholder="Restaurant, café, salon…"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="business-city"
                      className="text-xs font-medium"
                    >
                      City
                    </label>
                    <Input
                      id="business-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      maxLength={100}
                      autoComplete="address-level2"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="business-phone"
                    className="text-xs font-medium"
                  >
                    Business phone{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    id="business-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={30}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save & continue"}
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </>
          ) : step === 1 || step === 2 ? (
            <>
              <p className="mb-4 text-xs font-medium text-primary">
                STEP {step === 1 ? "02" : "03"} ·{" "}
                {step === 1 ? "GOOGLE AUTHORIZATION" : "PROFILE SELECTION"}
              </p>
              {googleNotice && (
                <p
                  role="status"
                  className="mb-5 rounded-md border bg-muted/30 p-4 text-xs leading-relaxed"
                >
                  {googleNotice}
                </p>
              )}
              <GoogleConnectionPanel
                organizationId={workspace.organization.id}
                csrfToken={csrfToken}
                initial={googleState}
                onStateChange={() => router.refresh()}
              />
              <p className="my-5 text-xs leading-relaxed text-muted-foreground">
                Google API access and business permissions determine
                availability. Completion comes from the server after
                authorization and profile selection; continuing does not mark a
                pending step complete.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => go(step - 1)}>
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <Button onClick={() => go(step + 1)}>
                  Continue for now
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-primary">
                STEP 04 · APPEARANCE DRAFT
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                A little personality for your page.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Save a greeting and color for your future QR page. This does not
                publish a page or generate a scannable code.
              </p>
              <div className="mt-7 grid gap-7 xl:grid-cols-[1fr_230px]">
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save({ step: "qr", greeting, accentColor });
                  }}
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="qr-greeting"
                      className="text-xs font-medium"
                    >
                      Welcome message
                    </label>
                    <textarea
                      id="qr-greeting"
                      value={greeting}
                      onChange={(e) => setGreeting(e.target.value)}
                      required
                      maxLength={160}
                      rows={4}
                      className="market-textarea"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {greeting.length} / 160 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="qr-accent" className="text-xs font-medium">
                      Accent color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="qr-accent"
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="size-10 cursor-pointer rounded border bg-card p-1"
                      />
                      <span className="font-mono text-xs text-muted-foreground">
                        {accentColor}
                      </span>
                    </div>
                  </div>
                  {!workspace.onboarding.businessSaved && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Save your business details first to enable the appearance
                      draft.
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={pending || !workspace.onboarding.businessSaved}
                  >
                    {pending ? "Saving…" : "Save appearance draft"}
                    <Check className="size-4" />
                  </Button>
                </form>
                <aside
                  aria-label="Appearance preview"
                  className="rounded-xl border bg-background p-5 text-center"
                >
                  <span
                    style={{ backgroundColor: accentColor }}
                    className="mx-auto grid size-11 place-items-center rounded-full"
                  >
                    <Store
                      className="size-5 text-white"
                      style={{ filter: "drop-shadow(0 1px 1px #0008)" }}
                    />
                  </span>
                  <h3 className="mt-4 break-words text-sm font-semibold">
                    {name || "Your business"}
                  </h3>
                  <p className="mt-3 break-words text-xs leading-relaxed text-muted-foreground">
                    {greeting}
                  </p>
                  <div className="mt-5 rounded-md border border-dashed py-4 text-[10px] text-muted-foreground">
                    Appearance preview only
                    <br />
                    No live QR destination
                  </div>
                </aside>
              </div>
              {workspace.onboarding.qrSaved && (
                <div className="mt-6 flex items-start gap-3 rounded-lg border bg-accent/30 p-4">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Your available setup is saved.
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {workspace.onboarding.steps.find(
                        (s) => s.key === "google",
                      )?.status === "complete" &&
                      workspace.onboarding.steps.find(
                        (s) => s.key === "location",
                      )?.status === "complete"
                        ? "Google authorization and profile selection are saved. Check review sync status in your inbox."
                        : "Google authorization or profile selection still needs attention."}{" "}
                      You can return to your dashboard and revisit setup
                      anytime.
                    </p>
                    <Link
                      href="/dashboard"
                      className={buttonVariants({
                        className: "mt-4",
                        size: "sm",
                      })}
                    >
                      Continue to dashboard
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-md border border-destructive/30 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="mt-5 text-xs font-medium text-primary">
              {saved}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
