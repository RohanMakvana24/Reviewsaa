"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  googleReviewsSchema,
  type GoogleBusinessState,
  type GoogleReviews,
} from "@reviesnest/contracts";
import { MessageSquareText, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GoogleConnectionPanel,
  googleErrorMessage,
} from "@/components/google-business-panel";
export function GoogleReviewInbox({
  organizationId,
  csrfToken,
  initialState,
  initialReviews,
}: {
  organizationId: string;
  csrfToken: string;
  initialState: GoogleBusinessState;
  initialReviews: GoogleReviews | null;
}) {
  const [state, setState] = useState(initialState),
    [data, setData] = useState(initialReviews),
    [query, setQuery] = useState(""),
    [rating, setRating] = useState(""),
    [reply, setReply] = useState("all"),
    [pending, setPending] = useState(false),
    [error, setError] = useState(
      initialReviews
        ? ""
        : "Reviews could not be loaded. Check the connection and retry.",
    );
  const [filters, setFilters] = useState({
    query: "",
    rating: "",
    reply: "all",
  });
  const appliedFilters = useRef(filters);
  useEffect(() => {
    appliedFilters.current = filters;
  }, [filters]);
  const load = useCallback(
    async (
      page: number,
      values: { query: string; rating: string; reply: string },
    ) => {
      setPending(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          query: values.query,
          reply: values.reply,
        });
        if (values.rating) params.set("rating", values.rating);
        const response = await fetch(
          `/api/organizations/${encodeURIComponent(organizationId)}/google-business/reviews?${params}`,
          { cache: "no-store" },
        );
        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }
        const body = await response.json();
        if (!response.ok)
          throw new Error(
            googleErrorMessage(
              typeof body.error === "string" ? body.error : "",
              response.status,
            ),
          );
        setData(googleReviewsSchema.parse(body));
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Reviews could not be loaded.",
        );
      } finally {
        setPending(false);
      }
    },
    [organizationId],
  );
  useEffect(() => {
    setState(initialState);
    const current = appliedFilters.current;
    if (current.query || current.rating || current.reply !== "all")
      void load(1, current);
    else setData(initialReviews);
  }, [initialState, initialReviews, load]);
  const syncing =
    state.location?.syncStatus === "QUEUED" ||
    state.location?.syncStatus === "SYNCING";
  useEffect(() => {
    if (!syncing) return;
    const timer = setInterval(() => void load(1, filters), 15000);
    return () => clearInterval(timer);
  }, [syncing, load, filters]);
  const connectionChanged = useCallback(
    (next: GoogleBusinessState) => {
      setState(next);
      if (
        !next.location ||
        [
          "DISCONNECTED",
          "NEEDS_RECONNECT",
          "ACCESS_DENIED",
          "API_ACCESS_REQUIRED",
          "REVOCATION_PENDING",
        ].includes(next.connection?.status || "DISCONNECTED")
      )
        setData(null);
      else if (next.location.syncStatus === "IDLE") void load(1, filters);
    },
    [load, filters],
  );
  return (
    <>
      <div className="mb-7">
        <p className="mb-2 text-[10px] font-semibold tracking-[0.15em] text-primary">
          LISTEN. RESPOND. CONNECT.
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Review inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reviews from Google, for the profile you authorize. Reply publishing
          arrives in the next phase.
        </p>
      </div>
      <GoogleConnectionPanel
        organizationId={organizationId}
        csrfToken={csrfToken}
        initial={initialState}
        onStateChange={connectionChanged}
      />
      <section
        className="mt-6 overflow-hidden rounded-lg border bg-card"
        aria-label="Reviews from Google"
      >
        <div className="border-b p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Reviews from Google</h2>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => load(data?.page || 1, filters)}
            >
              Refresh inbox
            </Button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {data
              ? `${data.cachedCount} cached reviews${data.googleTotalReviewCount !== null ? ` · ${data.googleTotalReviewCount} total on Google` : ""}`
              : "No review cache loaded."}
            {data?.lastSyncedAt && (
              <>
                {" "}
                · Last synced{" "}
                {new Date(data.lastSyncedAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}{" "}
                IST
              </>
            )}
          </p>
          {data?.truncated && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              This is a limited cache of up to 500 reviews, not the complete
              Google history.
            </p>
          )}
          <form
            className="mt-5 flex flex-wrap gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const next = { query, rating, reply };
              setFilters(next);
              void load(1, next);
            }}
          >
            <div className="relative min-w-0 flex-1 basis-52">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                aria-label="Search Google reviews"
                className="pl-9"
                placeholder="Search reviewer or feedback"
                value={query}
                maxLength={100}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              aria-label="Filter Google reviews by rating"
              className="h-10 rounded-md border bg-background px-3 text-xs"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={String(n)}>
                  {n} stars
                </option>
              ))}
            </select>
            <select
              aria-label="Filter Google reviews by reply"
              className="h-10 rounded-md border bg-background px-3 text-xs"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            >
              <option value="all">All reply statuses</option>
              <option value="unanswered">Unanswered</option>
              <option value="replied">Replied</option>
            </select>
            <Button variant="outline" disabled={pending} type="submit">
              Apply filters
            </Button>
          </form>
        </div>
        {error && (
          <p
            role="alert"
            className="m-5 rounded-md border border-destructive/40 p-3 text-xs leading-relaxed"
          >
            {error}
          </p>
        )}
        {pending && (
          <p role="status" className="px-5 py-3 text-xs text-muted-foreground">
            Loading reviews…
          </p>
        )}
        {!pending && !data?.reviews.length && (
          <div className="px-5 py-14 text-center">
            <MessageSquareText className="mx-auto size-8 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-semibold">
              {state.location
                ? "No reviews match this view"
                : "Connect and select a business profile"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {state.location
                ? "Try another filter, or request a sync. Empty results do not mean Google has no reviews."
                : "Your actual Google reviews will appear after authorization and a successful sync. No sample reviews are mixed into this inbox."}
            </p>
          </div>
        )}
        <div className="divide-y">
          {data?.reviews.map((review) => (
            <article key={review.id} className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                  {(review.reviewerName || "?").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-semibold">
                    {review.reviewerName || "Anonymous reviewer"}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {review.rating !== null ? (
                      <span
                        role="img"
                        aria-label={`${review.rating} out of 5 stars`}
                        className="flex gap-0.5"
                      >
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            aria-hidden="true"
                            className={`size-3.5 ${i < review.rating! ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40"}`}
                          />
                        ))}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Rating not provided
                      </span>
                    )}
                    {(review.updateTime || review.createTime) && (
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(
                          (review.updateTime || review.createTime)!,
                        ).toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {review.comment || "This review has no written feedback."}
                  </p>
                  {review.replyComment && (
                    <section
                      className="mt-4 rounded-md border bg-muted/30 p-4"
                      aria-label={`Existing owner reply to ${review.reviewerName || "anonymous reviewer"}`}
                    >
                      <p className="text-xs font-semibold">
                        Owner reply on Google
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
                        {review.replyComment}
                      </p>
                    </section>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
        {data && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t p-5 text-xs text-muted-foreground">
            <span>
              {data.totalMatched} matches in cached reviews · Page {data.page}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pending || data.page <= 1}
                onClick={() => load(data.page - 1, filters)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending || !data.nextPage}
                onClick={() => load(data.page + 1, filters)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Google content is cached temporarily and may differ from the latest
        Google page. Reviewer names and existing replies are displayed as
        supplied. No reply is posted by this page.
      </p>
    </>
  );
}
