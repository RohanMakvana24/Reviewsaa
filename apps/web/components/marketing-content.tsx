import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Coffee,
  MessageSquareText,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Scissors,
  Dumbbell,
} from "lucide-react";
import type { PublicConfig } from "@reviesnest/contracts";
import { buttonVariants } from "@/components/ui/button";
export function EarlyAccessNote() {
  return (
    <aside
      aria-label="Early access availability"
      className="market-availability"
    >
      <span className="size-2 shrink-0 rounded-full bg-primary" />
      <p>
        <strong>Early access:</strong> business setup and trial tracking are
        available. Google review sync, AI replies, public QR publishing and
        payments are coming later.
      </p>
    </aside>
  );
}
export function ProductPreview() {
  return (
    <div className="market-product">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="grid size-7 place-items-center rounded-md bg-accent text-primary">
            OE
          </span>
          Olive & Ember
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">
          PRODUCT PREVIEW · SAMPLE DATA
        </span>
      </div>
      <div className="p-5 sm:p-7">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              A reputation worth caring for
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-4xl font-semibold tracking-tight">4.8</span>
              <div>
                <div
                  className="flex text-amber-600"
                  role="img"
                  aria-label="Sample rating 4.8 out of 5 stars"
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="size-3.5" fill="currentColor" />
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Illustrative business rating
                </p>
              </div>
            </div>
          </div>
          <span className="grid size-11 place-items-center rounded-full border bg-accent">
            <Coffee className="size-5 text-primary" />
          </span>
        </div>
        <div className="space-y-4">
          <article className="rounded-lg border bg-background p-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-muted text-[10px] font-semibold">
                  PS
                </span>
                <span className="text-xs font-semibold">Priya S.</span>
              </div>
              <span
                className="text-xs tracking-widest text-amber-600"
                role="img"
                aria-label="5 stars"
              >
                ★★★★★
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed">
              “Wonderful coffee, a warm welcome, and a lovely little place to
              slow down.”
            </p>
            <div className="mt-4 border-t pt-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
                <Sparkles className="size-3" />
                Example reply draft
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Thank you, Priya! We’re happy your visit felt like a little
                pause in the day.
              </p>
            </div>
          </article>
          <div className="flex items-center justify-between rounded-lg border border-dashed p-3.5">
            <span className="flex items-center gap-2 text-xs">
              <ShieldCheck className="size-4 text-primary" />
              Your voice. Your approval.
            </span>
            <span className="text-[10px] text-muted-foreground">
              AI connection pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
export function HomeContent({
  config,
  available,
}: {
  config: PublicConfig;
  available: boolean;
}) {
  return (
    <>
      <section className="market-wrap market-hero">
        <div className="market-hero-copy">
          <p className="market-eyebrow">FOR THE PLACES PEOPLE COME BACK TO</p>
          <h1>
            A little more care.
            <br />
            <span className="market-highlight">A better reputation.</span>
          </h1>
          <p className="market-lede">
            You take care of your customers. Give their feedback the same
            attention—with one simple workspace for your business.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Start your {config.trialDays}-day trial{" "}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/features"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See what’s inside
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No payment required · No automatic charge · One business workspace
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Coffee className="size-3.5" />
              Cafés & restaurants
            </span>
            <span className="flex items-center gap-1.5">
              <Scissors className="size-3.5" />
              Salons
            </span>
            <span className="flex items-center gap-1.5">
              <Dumbbell className="size-3.5" />
              Local favorites
            </span>
          </div>
        </div>
        <div className="market-hero-visual">
          <ProductPreview />
          <div className="market-preview-note">
            <span className="size-2 rounded-full bg-amber-600" />A look at what
            we’re building. Reviews and replies shown are examples.
          </div>
        </div>
      </section>
      <div className="market-wrap">
        <EarlyAccessNote />
      </div>
      <section className="market-wrap market-section">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="market-eyebrow">LESS TO JUGGLE</p>
            <h2 className="market-h2">
              Your business is personal.
              <br />
              Your tools should feel simple.
            </h2>
          </div>
          <div className="space-y-0">
            {[
              [
                "01",
                "Start with your place",
                "Add your business details and make the workspace yours. Your trial and usage are tracked on the server.",
                "Available now",
              ],
              [
                "02",
                "Bring every conversation together",
                "Connect an authorized Google Business Profile and see your customer reviews in one inbox.",
                "Coming later",
              ],
              [
                "03",
                "Respond with a little help",
                "Prepare thoughtful AI-assisted replies, review them, and keep your business voice in control.",
                "Coming later",
              ],
            ].map(([num, title, desc, status]) => (
              <article key={num} className="market-feature-row">
                <span className="text-xs font-medium text-muted-foreground">
                  {num}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {title}
                    </h3>
                    <span className="text-[10px] font-medium text-primary">
                      {status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="market-band">
        <div className="market-wrap grid items-center gap-10 py-14 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="market-eyebrow">
              SMALL BUSINESS. STRAIGHTFORWARD PRICING.
            </p>
            <h2 className="market-h2">
              Room to try it.
              <br />A price that stays grounded.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Begin with a free workspace trial. Our proposed Basic plan keeps
              things simple for one business profile, with manual renewals when
              payments launch.
            </p>
            <Link
              href="/pricing"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Explore the plan <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="market-price-inline">
            <div>
              <span className="text-6xl font-semibold tracking-tighter">
                ₹{config.priceMonthlyInr}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">
                / month
              </span>
              <p className="mt-3 text-xs font-medium text-primary">
                Proposed Basic plan · Checkout not yet available
              </p>
              {!available && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Provisional offer shown while pricing service is unavailable.
                </p>
              )}
            </div>
            <ul className="mt-6 space-y-3 border-t pt-5 text-sm">
              {[
                "1 Google Business Profile",
                `${config.paidAiAllowance} AI generations per month`,
                "Manual renewal. No AutoPay.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="size-4 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="market-wrap market-section">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="market-eyebrow">BUILT ON REAL EXPERIENCES</p>
            <h2 className="market-h2">
              Good feedback starts
              <br />
              with honest choices.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            No fake reviews. No filtering unhappy customers away from Google. No
            promise of higher rankings. Just better ways to listen and respond.
          </p>
        </div>
        <div className="mt-10 grid gap-8 border-y py-7 sm:grid-cols-3">
          {[
            [
              ShieldCheck,
              "Your permission comes first",
              "Google sign-in and Business Profile access are separate.",
            ],
            [
              MessageSquareText,
              "Your customers speak for themselves",
              "A QR page will offer the same review option to everyone.",
            ],
            [
              Store,
              "Your business stays in control",
              "No hidden automatic renewal or unapproved connection.",
            ],
          ].map(([Icon, title, desc]) => {
            const I = Icon as typeof Store;
            return (
              <div key={String(title)}>
                <I className="mb-4 size-5 text-primary" />
                <h3 className="text-sm font-semibold">{String(title)}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {String(desc)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-5">
          <p className="text-2xl font-semibold tracking-tight">
            Let’s make your workspace feel like your place.
          </p>
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Start your free trial <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
const features = [
  {
    icon: Store,
    title: "A home for your business",
    status: "Available now",
    text: "Save your business name, category, city and contact details. Your owner account stays separate from other businesses.",
  },
  {
    icon: ShieldCheck,
    title: "A real, transparent trial",
    status: "Available now",
    text: "14 days from first workspace creation, server-tracked usage, and no automatic charge when the trial ends.",
  },
  {
    icon: QrCode,
    title: "Your QR page, your personality",
    status: "Draft setup available",
    text: "Choose a greeting and accent color. Public publishing and downloadable QR codes will arrive in a later release.",
  },
  {
    icon: MessageSquareText,
    title: "One review inbox",
    status: "Coming later",
    text: "Read reviews from your authorized Google Business Profile and manage owner replies in one place.",
  },
  {
    icon: Sparkles,
    title: "Thoughtful reply assistance",
    status: "Coming later",
    text: "Create drafts with AI, edit them to sound like you, and approve public replies. AI generation is not live yet.",
  },
];
export function FeaturesContent() {
  return (
    <>
      <PageIntro
        eyebrow="MADE FOR YOUR EVERYDAY"
        title="Less admin. More attention."
        description="A simple workspace for the details that make people trust your business."
      />
      <div className="market-wrap pb-20">
        <EarlyAccessNote />
        <div className="mt-9 divide-y">
          {features.map(({ icon: Icon, title, status, text }, i) => (
            <article
              className="grid gap-5 py-8 sm:grid-cols-[70px_1fr_160px]"
              key={title}
            >
              <span className="flex items-center gap-3 text-muted-foreground">
                <span className="text-xs">0{i + 1}</span>
                <Icon className="size-5 text-primary" />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </div>
              <p className="text-xs font-medium text-primary sm:text-right">
                {status}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-lg border bg-card p-6">
          <p className="text-sm">Want to see whether it fits your business?</p>
          <Link href="/login" className={buttonVariants()}>
            Create your workspace <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="market-wrap py-14 sm:py-20">
      <p className="market-eyebrow">{eyebrow}</p>
      <h1 className="market-page-title">{title}</h1>
      <p className="market-lede max-w-2xl">{description}</p>
    </section>
  );
}
export function PricingContent({
  config,
  available,
}: {
  config: PublicConfig;
  available: boolean;
}) {
  return (
    <>
      <PageIntro
        eyebrow="START SMALL. STAY IN CONTROL."
        title="One business. One simple plan."
        description="A free trial to find your feet. A grounded monthly price when the full service launches."
      />
      <div className="market-wrap pb-20">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-xl border bg-card p-7 sm:p-9">
            <p className="text-sm font-semibold">Your free workspace trial</p>
            <h2 className="mt-5 text-5xl font-semibold tracking-tight">
              {config.trialDays} days
              <span className="ml-2 text-lg font-normal text-muted-foreground">
                ₹0
              </span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Starts when your first business workspace is created. No payment
              details required.
            </p>
            <ul className="my-7 space-y-4 text-sm">
              {[
                "Business onboarding and saved QR appearance draft",
                `${config.trialAiAllowance} total trial generations reserved for the AI release`,
                "Server-tracked dates and usage",
                "No automatic charge when your trial ends",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="size-4 shrink-0 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className={buttonVariants({ className: "w-full", size: "lg" })}
            >
              Start free trial <ArrowRight className="size-4" />
            </Link>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Google sync and AI generation are not available during this
              early-access release. Your trial clock starts at workspace
              creation.
            </p>
          </section>
          <section className="rounded-xl border border-primary/40 bg-accent/40 p-7 sm:p-9">
            <p className="text-sm font-semibold">
              Basic · Proposed launch offer
            </p>
            <h2 className="mt-5 text-5xl font-semibold tracking-tight">
              ₹{config.priceMonthlyInr}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                / month
              </span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Designed for one local business profile. Final pricing and tax
              treatment will be confirmed before checkout opens.
            </p>
            <ul className="my-7 space-y-4 text-sm">
              {[
                "1 Google Business Profile",
                `${config.paidAiAllowance} AI generations per month`,
                "Review inbox and owner replies",
                "Branded public QR page",
                "One-time payment and manual renewal",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="size-4 shrink-0 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
            <Link
              href="/contact"
              className={buttonVariants({
                variant: "outline",
                className: "w-full",
                size: "lg",
              })}
            >
              Ask about launch <ArrowRight className="size-4" />
            </Link>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Checkout is not connected. No subscription or AutoPay mandate will
              be created.
            </p>
          </section>
        </div>
        {!available && (
          <p role="status" className="mt-5 text-xs text-muted-foreground">
            The pricing service is temporarily unavailable. The figures above
            are provisional defaults; no payment is being accepted.
          </p>
        )}
        <div className="mt-10">
          <EarlyAccessNote />
        </div>
        <div className="mt-10 grid gap-7 border-t pt-8 sm:grid-cols-3">
          {[
            [
              "Can I restart my trial?",
              "A trial is available once per eligible identity. Signing out or changing business details does not restart it.",
            ],
            [
              "What happens after 14 days?",
              "Trial-controlled generation stops at expiry. Your saved business details remain available; no automatic payment occurs.",
            ],
            [
              "Have more than one branch?",
              "The initial offer is for one profile. Contact us about future multi-branch options.",
            ],
          ].map(([title, text]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
export const faqItems = [
  [
    "What can I use right now?",
    "You can sign in with Google, create your business workspace, save business details and a QR appearance draft, and view your server-tracked trial. Google review sync, AI generation, public QR publishing and checkout are not live yet.",
  ],
  [
    "Does signing in connect my Google reviews?",
    "No. Google sign-in only identifies your account. A separate Business Profile connection and permission will be required when that integration launches.",
  ],
  [
    "When does the 14-day trial start?",
    "It starts when your first workspace is created, not when you connect Google reviews. Signing out or editing your business does not reset the dates.",
  ],
  [
    "Will I be charged after the trial?",
    "No. There is no automatic trial-to-paid conversion, payment mandate or AutoPay. Future plan purchases and renewals will be initiated by you.",
  ],
  [
    "Can ReviesNest write customer reviews?",
    "No. Customers must share their own genuine experiences and submit Google reviews themselves. Future AI assistance is for business-owner replies.",
  ],
  [
    "Can unhappy customers still leave a Google review?",
    "Yes. Future QR pages will provide the same Google review option regardless of a customer’s rating or sentiment. We do not support review gating.",
  ],
  [
    "Will this improve my Google ranking?",
    "We do not guarantee more reviews, higher ratings, rankings or sales. The product is designed to make legitimate reputation-management tasks easier.",
  ],
  [
    "How do I request help or deletion?",
    "Use the contact form and include the email associated with your account. Account-specific requests require identity verification.",
  ],
];
export function FaqContent() {
  return (
    <>
      <PageIntro
        eyebrow="A FEW THINGS WORTH KNOWING"
        title="Clear answers. No small print."
        description="What the trial includes, how permissions work, and what’s still on the way."
      />
      <div className="market-wrap pb-20">
        <div className="mx-auto max-w-3xl divide-y border-y">
          {faqItems.map(([q, a]) => (
            <details className="market-faq" key={q}>
              <summary className="flex cursor-pointer items-center justify-between gap-5 py-6 text-base font-medium">
                <span>{q}</span>
                <ChevronRight className="size-4 shrink-0 text-primary" />
              </summary>
              <p className="pb-6 text-sm leading-relaxed text-muted-foreground">
                {a}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Something else on your mind?{" "}
          <Link
            href="/contact"
            className="font-semibold text-primary underline underline-offset-4"
          >
            Let’s talk.
          </Link>
        </p>
      </div>
    </>
  );
}
