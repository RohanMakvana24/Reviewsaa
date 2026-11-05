import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
export const metadata = { title: "Access restricted" };
export default async function Forbidden() {
  await requireSession();
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="max-w-md rounded-xl border bg-card p-8">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="my-4 text-sm text-muted-foreground">
          Your account does not have permission to open this workspace.
        </p>
        <Link href="/dashboard" className={buttonVariants()}>
          Return to your dashboard
        </Link>
      </section>
    </main>
  );
}
