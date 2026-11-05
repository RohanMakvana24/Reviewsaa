import { requireSession } from "@/lib/auth";
import { getGoogleBusinessState, getGoogleReviews } from "@/lib/workspace";
import { GoogleReviewInbox } from "@/components/google-review-inbox";
export const metadata = { title: "Reviews" };
export default async function Page() {
  const session = await requireSession();
  const org = session.organizations[0];
  if (!org)
    return (
      <section>
        <h1 className="text-2xl font-semibold">No active workspace</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          An active business workspace is needed to connect Google reviews.
        </p>
      </section>
    );
  const [state, reviews] = await Promise.all([
    getGoogleBusinessState(org.id),
    getGoogleReviews(org.id),
  ]);
  return (
    <GoogleReviewInbox
      organizationId={org.id}
      csrfToken={session.csrfToken}
      initialState={state}
      initialReviews={reviews}
    />
  );
}
