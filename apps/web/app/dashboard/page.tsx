import { requireSession } from "@/lib/auth";
import { getGoogleBusinessState, getGoogleReviews } from "@/lib/workspace";
import { GoogleOwnerOverview } from "@/components/google-owner-overview";
export const metadata = { title: "Overview" };
export default async function Page() {
  const session = await requireSession();
  const org = session.organizations[0];
  const [state, reviews] = org
    ? await Promise.all([
        getGoogleBusinessState(org.id),
        getGoogleReviews(org.id),
      ])
    : [null, null];
  return (
    <GoogleOwnerOverview
      name={session.user.name}
      state={state}
      reviews={reviews}
    />
  );
}
