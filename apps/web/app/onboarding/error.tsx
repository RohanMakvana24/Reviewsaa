"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-5 py-20">
      <h1 className="text-2xl font-semibold">We couldn’t load your setup.</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Your saved details have not been changed. Please retry, or contact us if
        the problem continues.
      </p>
      <div className="mt-6 flex gap-4">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/contact"
          className="self-center text-sm font-medium text-primary"
        >
          Contact us
        </Link>
      </div>
    </main>
  );
}
