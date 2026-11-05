import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getGoogleBusinessState, getWorkspace } from "@/lib/workspace";
import { OnboardingWizard } from "@/components/onboarding-wizard";
export const metadata = {
  title: "Set up your business",
  robots: { index: false, follow: false },
};
export default async function Onboarding() {
  const session = await requireSession();
  const org = session.organizations[0];
  if (!org)
    return (
      <main className="mx-auto max-w-xl px-5 py-20">
        <h1 className="text-2xl font-semibold">No active workspace</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Your account does not have an active business workspace. Contact the
          team if you need help with access.
        </p>
        <Link
          className="mt-6 inline-block font-medium text-primary underline"
          href="/contact"
        >
          Contact us
        </Link>
      </main>
    );
  const [workspace, googleState] = await Promise.all([
    getWorkspace(org.id),
    getGoogleBusinessState(org.id),
  ]);
  return (
    <OnboardingWizard
      initial={workspace}
      csrfToken={session.csrfToken}
      googleState={googleState}
    />
  );
}
