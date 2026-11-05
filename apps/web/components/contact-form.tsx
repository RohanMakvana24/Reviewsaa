"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function ContactForm() {
  const [pending, setPending] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  return sent ? (
    <section role="status" className="rounded-xl border bg-card p-8">
      <CheckCircle2 className="size-8 text-primary" />
      <h2 className="mt-5 text-xl font-semibold">Thanks for reaching out.</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Your message has been received. Keep the email you provided available
        for any follow-up. No automatic email confirmation is sent.
      </p>
      <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
        Send another message
      </Button>
    </section>
  ) : (
    <form
      className="space-y-5 rounded-xl border bg-card p-6 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const values = new FormData(form);
        setError("");
        setPending(true);
        try {
          const response = await fetch("/api/public/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: values.get("name"),
              email: values.get("email"),
              business: values.get("business") || "",
              message: values.get("message"),
              website: values.get("website") || "",
            }),
          });
          if (response.status !== 202) {
            setError(
              response.status === 429
                ? "You’ve sent several requests. Please try again later."
                : response.status === 400
                  ? "Please check your details and write a message of at least 10 characters."
                  : "Your message could not be sent. Please retry shortly.",
            );
            return;
          }
          setSent(true);
          form.reset();
        } catch {
          setError(
            "Your message could not be sent. Check your connection and retry.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="contact-name" className="text-xs font-medium">
            Your name
          </label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-email" className="text-xs font-medium">
            Email address
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="contact-business" className="text-xs font-medium">
          Business name{" "}
          <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="contact-business"
          name="business"
          autoComplete="organization"
          maxLength={100}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="contact-message" className="text-xs font-medium">
          How can we help?
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          className="market-textarea"
          placeholder="Tell us a little about your business or your question."
        />
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending…" : "Send message"}
        <ArrowRight className="size-4" />
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        We use these details to review your inquiry. Never include passwords,
        API keys, payment details or Google credentials.
      </p>
    </form>
  );
}
