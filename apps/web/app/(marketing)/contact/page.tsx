import { ContactForm } from "@/components/contact-form";
import { PageIntro } from "@/components/marketing-content";
import { publicMetadata } from "@/lib/site";
import { MessageSquareText, ShieldCheck } from "lucide-react";
export const metadata = publicMetadata(
  "Let’s talk about your business",
  "Contact ReviesNest about early access, your account or a future plan.",
  "/contact",
);
export default function Contact() {
  return (
    <>
      <PageIntro
        eyebrow="LET’S TALK"
        title="Tell us about your place."
        description="A question about your workspace? Curious about launch? We’d like to hear from you."
      />
      <div className="market-wrap grid items-start gap-10 pb-20 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-8">
          <div>
            <MessageSquareText className="size-6 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">
              A conversation, not a sales script.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Tell us what you run, what you need and what would make managing
              feedback easier. Messages are saved for the team to review.
            </p>
          </div>
          <div className="border-t pt-6">
            <ShieldCheck className="size-5 text-primary" />
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              For account requests, use the email associated with your Google
              sign-in. We may verify your identity before making account
              changes.
            </p>
          </div>
        </div>
        <ContactForm />
      </div>
    </>
  );
}
