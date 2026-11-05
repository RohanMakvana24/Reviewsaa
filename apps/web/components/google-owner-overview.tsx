import Link from "next/link";
import type { GoogleBusinessState, GoogleReviews } from "@reviesnest/contracts";
import {
  Star,
  MessageSquareText,
  RefreshCw,
  Store,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
export function GoogleOwnerOverview({
  name,
  state,
  reviews,
}: {
  name: string;
  state: GoogleBusinessState | null;
  reviews: GoogleReviews | null;
}) {
  const location = state?.location;
  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-semibold tracking-[0.15em] text-primary">
            YOUR BUSINESS, HEARD
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A clear view of the Google profile you manage.
          </p>
        </div>
        <Link href="/dashboard/reviews" className={buttonVariants()}>
          Open review inbox <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Google rating",
            value: reviews?.googleAverageRating?.toFixed(1) ?? "—",
            detail: "Provided by Google; not calculated from the cache",
            icon: Star,
          },
          {
            label: "Reviews on Google",
            value:
              reviews?.googleTotalReviewCount?.toLocaleString("en-IN") ?? "—",
            detail: "Latest successful Google summary",
            icon: MessageSquareText,
          },
          {
            label: "Cached reviews",
            value: reviews ? String(reviews.cachedCount) : "—",
            detail: "Temporary cache; up to 500 reviews",
            icon: Store,
          },
          {
            label: "Sync status",
            value: location?.syncStatus.toLowerCase() || "Not selected",
            detail: location?.lastSyncAt
              ? `Last sync ${new Date(location.lastSyncAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`
              : "No successful review sync yet",
            icon: RefreshCw,
          },
        ].map(({ label, value, detail, icon: Icon }) => (
          <section key={label} className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <h2>{label}</h2>
              <Icon className="size-4" />
            </div>
            <p className="mt-5 break-words text-2xl font-semibold tabular-nums">
              {value}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {detail}
            </p>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3">
          <Store className="size-5 text-primary" />
          <h2 className="text-base font-semibold">
            {location?.title || "Your Google Business Profile"}
          </h2>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {location
            ? "This overview uses actual cached Google data. Open the review inbox to check connection health, request a sync, and read feedback."
            : "Connect an authorized Google account, choose one business profile and request its reviews. API approval, profile access and verification may be required."}
        </p>
        <Link
          href="/onboarding"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          {location ? "View business setup" : "Continue business setup"}
          <ArrowRight className="size-4" />
        </Link>
      </section>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">Reviews from Google</h2>
          {reviews?.reviews.length ? (
            <ul className="mt-4 divide-y">
              {reviews.reviews.slice(0, 3).map((review) => (
                <li key={review.id} className="py-4">
                  <p className="text-sm font-medium">
                    {review.reviewerName || "Anonymous reviewer"}
                    {review.rating !== null && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {review.rating}/5
                      </span>
                    )}
                  </p>
                  <p className="mt-2 line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">
                    {review.comment || "Rating-only review"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              No cached review preview is available yet. Connect and sync your
              profile to see real feedback here.
            </p>
          )}
          <Link
            href="/dashboard/reviews"
            className="mt-4 inline-flex text-xs font-semibold text-primary"
          >
            View inbox →
          </Link>
        </section>
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">What’s available</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Your business details, trial tracking and appearance draft are saved
            to your workspace. Google reviews depend on your actual connection
            and successful sync.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Reply publishing, AI generation, public QR publishing and paid
            checkout are not enabled in this phase. No sample ratings or trends
            are presented as your business results.
          </p>
        </section>
      </div>
    </>
  );
}
