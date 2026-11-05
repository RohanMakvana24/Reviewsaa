"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div role="alert" className="rounded-lg border bg-card p-8">
      <h1 className="text-xl font-semibold">We couldn’t load this workspace</h1>
      <p className="my-4 text-sm text-muted-foreground">
        Please try again. No changes have been made to your business.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
