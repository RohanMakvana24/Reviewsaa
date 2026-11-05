import Link from "next/link";
import { PageIntro } from "@/components/marketing-content";
type LegalSection = { title: string; text: string };
const documents: Record<
  string,
  { title: string; description: string; sections: LegalSection[] }
> = {
  privacy: {
    title: "Privacy policy",
    description:
      "How this early-access workspace handles the information you share.",
    sections: [
      {
        title: "What we collect",
        text: "Google sign-in provides your stable Google identity, name and verified email. We store account details, organization membership, sessions, saved business details, QR appearance drafts and contact-form messages. When you authorize Google Business Profile, we encrypt its access credentials and temporarily cache selected-profile information and review data. We also record security and account-change events.",
      },
      {
        title: "Why we use it",
        text: "We use account information to identify you, protect your workspace, provide onboarding and trial tracking, and review support or launch inquiries. We do not sell your contact details.",
      },
      {
        title: "Cookies and sign-in providers",
        text: "Essential session cookies keep you signed in. A short-lived cookie protects the Google sign-in request. Theme and preview preferences may be stored on your device. No marketing analytics or advertising trackers are currently integrated. Google handles its own consent and identity services under its policies.",
      },
      {
        title: "Retention and access",
        text: "Account sessions have a seven-day lifetime and sign-in attempts expire after ten minutes. Business records remain while the workspace is retained. Trial eligibility records include hashes of the Google subject and normalized email and are kept separately to prevent repeated trials. These hashes are not a claim of full anonymization. Security, legal or accounting needs may require some records to remain after closure; contact us for an account-specific request.",
      },
      {
        title: "Your choices",
        text: "You can update your display name and business details, sign out, and contact us to request access, correction or account deletion. We verify identity before acting on requests concerning an account.",
      },
      {
        title: "What is not connected yet",
        text: "Google Business Profile access depends on project approval, owner authorization and eligible profiles. Google content is cached for up to seven days, with cleanup and immediate local removal on disconnect. Failed permission revocation may be retried while local access stays disabled. AI generation, public QR analytics and payment processing are not enabled in this release.",
      },
    ],
  },
  terms: {
    title: "Terms of use",
    description:
      "A clear starting point for trying ReviesNest during early access.",
    sections: [
      {
        title: "Early-access service",
        text: "ReviesNest is a working brand for an early-access business workspace. Current functions include account access, business onboarding, draft appearance settings and trial tracking. Features marked coming later are not a promise of present availability.",
      },
      {
        title: "Your account and authority",
        text: "Use accurate information, keep your Google account secure, and manage only businesses you own or are authorized to represent. Platform permissions are assigned by the service; registering does not grant administrator access.",
      },
      {
        title: "Trial and billing",
        text: "Eligible identities receive one 14-day trial starting at first workspace creation. Editing details, signing out or creating another account is not a right to a fresh trial. Generation limits and expiry are enforced server-side. No payment is collected automatically, and checkout is not enabled in this release.",
      },
      {
        title: "Real feedback only",
        text: "Do not fabricate reviews, impersonate customers, gate negative feedback or offer rewards conditional on positive reviews. Customers must submit their own genuine Google reviews. You remain responsible for content you approve or publish.",
      },
      {
        title: "Availability and outcomes",
        text: "Early-access features may change or be unavailable. We do not promise more reviews, higher ratings, search ranking or revenue. Third-party integrations depend on their providers, authorization and applicable policies.",
      },
      {
        title: "Before paid launch",
        text: "The operating entity, final paid-service terms, tax treatment and support arrangements will be confirmed before payments are accepted. These prelaunch terms are not a claim of legal certification. Contact us with questions or to request account closure.",
      },
    ],
  },
  "refund-policy": {
    title: "Refunds & cancellation",
    description: "You stay in control of whether and when you pay.",
    sections: [
      {
        title: "No current paid checkout",
        text: "This early-access release does not accept plan payments or create AutoPay mandates. Your trial does not automatically become a paid subscription, so there is no trial charge to cancel or refund.",
      },
      {
        title: "When a paid plan launches",
        text: "Purchases and renewals are planned as owner-initiated one-time payments. Final prices, tax treatment, service availability and applicable refund terms will be displayed before checkout is enabled.",
      },
      {
        title: "Questions about a payment",
        text: "If you believe a charge relates to ReviesNest, use the contact form with the payment reference, date and account email. Do not send full card, bank or UPI credentials. Any request will be reviewed against the actual transaction, published terms and applicable requirements.",
      },
      {
        title: "Leaving the service",
        text: "You can sign out or contact us to request workspace closure. Account closure and data deletion are separate from any future payment refund review. Some trial-eligibility and security records may need to remain as explained in our privacy policy.",
      },
    ],
  },
};
export function LegalContent({
  kind,
}: {
  kind: "privacy" | "terms" | "refund-policy";
}) {
  const doc = documents[kind];
  return (
    <>
      <PageIntro
        eyebrow="THE DETAILS, IN PLAIN LANGUAGE"
        title={doc.title}
        description={doc.description}
      />
      <article className="market-wrap pb-20">
        <div className="max-w-3xl">
          <p className="mb-8 rounded-lg border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
            Prelaunch policy · Working brand: ReviesNest · Updated 5 November
            2026. Paid checkout is not available.
          </p>
          <div className="space-y-8">
            {doc.sections.map(({ title, text }) => (
              <section key={title}>
                <h2 className="text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {text}
                </p>
              </section>
            ))}
          </div>
          <p className="mt-10 border-t pt-6 text-sm">
            Questions or account requests?{" "}
            <Link
              href="/contact"
              className="font-semibold text-primary underline underline-offset-4"
            >
              Contact us.
            </Link>
          </p>
        </div>
      </article>
    </>
  );
}
