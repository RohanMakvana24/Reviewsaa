import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-28 text-center">
      <p className="text-sm font-semibold text-primary">404 · PAGE NOT FOUND</p>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">
        A little off the beaten path.
      </h1>
      <p className="my-6 text-sm text-muted-foreground">
        This page does not exist. Head back to your workspace to keep exploring.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  );
}
