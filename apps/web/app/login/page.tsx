import Link from "next/link";
import { redirect } from "next/navigation";
import { Star, ShieldCheck } from "lucide-react";
import { getSession, googleAvailability } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
export const metadata = { title: "Sign in" };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const result = await getSession();
  if (result.state === "signed-in")
    redirect(
      result.session.user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard",
    );
  const availability = await googleAvailability();
  const { error } = await searchParams;
  const errors: Record<string, string> = {
    cancelled: "Google sign-in was cancelled. You can try again.",
    invalid_state:
      "Your sign-in request expired or could not be verified. Start again.",
    failed: "We could not complete Google sign-in. Please try again.",
    disabled: "This account is disabled. Contact the platform administrator.",
    unavailable: "Google sign-in is temporarily unavailable.",
  };
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-xl font-semibold"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Star className="size-4" />
          </span>
          ReviesNest
        </Link>
        <section className="rounded-xl border bg-card p-7 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to your workspace
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Sign in to manage your business reputation. Your Google account
            securely identifies you.
          </p>
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"
            >
              {errors[error] ||
                "Sign-in could not be completed. Please try again."}
            </p>
          )}
          {availability === "ready" ? (
            <a
              href="/api/auth/google"
              className={buttonVariants({ className: "mt-6 w-full" })}
            >
              Continue with Google
            </a>
          ) : (
            <>
              <button
                disabled
                className={buttonVariants({
                  className: "mt-6 w-full opacity-60",
                })}
              >
                Google sign-in unavailable
              </button>
              <p
                role="status"
                className="mt-3 text-xs leading-relaxed text-muted-foreground"
              >
                {availability === "unconfigured"
                  ? "Google sign-in is awaiting configuration by the administrator."
                  : "The sign-in service is temporarily unavailable. Please try again shortly."}
              </p>
            </>
          )}
          <div className="mt-6 flex gap-2 border-t pt-5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>
              Business Profile permissions are requested separately. Signing in
              does not connect your reviews or authorize automatic replies.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
