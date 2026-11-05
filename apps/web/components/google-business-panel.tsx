"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  googleAccountsSchema,
  googleBusinessStateSchema,
  googleLocationsSchema,
  type GoogleBusinessState,
} from "@reviesnest/contracts";
import {
  Link2,
  RefreshCw,
  ShieldCheck,
  Store,
  Unplug,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
export const connectionMessages: Record<string, string> = {
  API_ACCESS_REQUIRED:
    "Google API access is required for this project. Ask the platform team to check approval and enabled APIs, then retry.",
  ACCESS_DENIED:
    "Google denied access. Check that the connected account can manage this Business Profile.",
  NEEDS_RECONNECT:
    "Google authorization has expired or been revoked. Reconnect your account to continue.",
  RATE_LIMITED:
    "Google requests are temporarily limited. Wait before trying again.",
  PROVIDER_ERROR:
    "Google is temporarily unavailable. Your last successful sync has not been replaced.",
  PROVIDER_UNAVAILABLE:
    "Google is temporarily unavailable. Please retry later.",
  UNVERIFIED:
    "Google requires this business to be verified before its reviews can be read.",
  LOCATION_UNVERIFIED:
    "Google requires this business to be verified before its reviews can be read.",
  REVOCATION_PENDING:
    "Your local connection and cached data have been removed. Google permission removal is still pending.",
  NOT_CONFIGURED:
    "Google Business Profile connection is awaiting setup by the platform team.",
  PROFILE_LIMIT_REACHED:
    "Your plan allows one profile. Clear the selected profile before choosing another.",
  CANDIDATE_EXPIRED:
    "This profile choice has expired. Reload profiles and choose it again.",
  QUEUE_UNAVAILABLE:
    "The sync service is unavailable. Please try again shortly.",
  SYNC_COOLDOWN:
    "A sync was requested recently. Wait a few minutes before trying again.",
  ACCOUNT_MISMATCH:
    "Disconnect the current Google account before connecting a different account.",
};
export function googleErrorMessage(code: string, status?: number) {
  return (
    connectionMessages[code] ||
    (status === 429
      ? "Please wait before trying this action again."
      : status === 403
        ? "You do not have permission to perform this action."
        : "This action could not be completed. Please retry or contact support.")
  );
}
export function GoogleConnectionPanel({
  organizationId,
  csrfToken,
  initial,
  onStateChange,
  heading = true,
}: {
  organizationId: string;
  csrfToken: string;
  initial: GoogleBusinessState;
  onStateChange?: (state: GoogleBusinessState) => void;
  heading?: boolean;
}) {
  const [state, setState] = useState(initial),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [confirm, setConfirm] = useState(false);
  const [accounts, setAccounts] = useState<
      { name: string; accountName: string }[]
    >([]),
    [account, setAccount] = useState(""),
    [profiles, setProfiles] = useState<
      { candidateId: string; title: string }[]
    >([]),
    [candidate, setCandidate] = useState(""),
    [nextPage, setNextPage] = useState<string | null>(null),
    [discovered, setDiscovered] = useState(false),
    [accountsTruncated, setAccountsTruncated] = useState(false);
  const router = useRouter();
  const base = `/api/organizations/${encodeURIComponent(organizationId)}/google-business`;
  useEffect(() => {
    setState(initial);
  }, [initial]);
  const accept = useCallback(
    (value: GoogleBusinessState) => {
      setState(value);
      onStateChange?.(value);
    },
    [onStateChange],
  );
  const refresh = useCallback(async () => {
    const response = await fetch(base, { cache: "no-store" });
    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }
    if (!response.ok) throw new Error("Unable to refresh connection status.");
    accept(googleBusinessStateSchema.parse(await response.json()));
  }, [base, accept]);
  const busySync =
    state.location?.syncStatus === "QUEUED" ||
    state.location?.syncStatus === "SYNCING";
  useEffect(() => {
    if (!busySync) return;
    const timer = setInterval(() => {
      void refresh().catch(() =>
        setError(
          "Connection status could not be refreshed. Use Refresh status to retry.",
        ),
      );
    }, 15000);
    return () => clearInterval(timer);
  }, [busySync, refresh]);
  async function api(path: string, method = "GET", body?: unknown) {
    const response = await fetch(`${base}${path}`, {
      method,
      credentials: "same-origin",
      headers:
        method === "GET"
          ? {}
          : { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 401) {
      window.location.assign("/login");
      throw new Error("Your session has expired.");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        googleErrorMessage(
          typeof data.error === "string" ? data.error : "",
          response.status,
        ),
      );
    return data;
  }
  async function perform(action: () => Promise<void>) {
    setPending(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "This action could not be completed.",
      );
      // A failed Google request may have revoked local access or purged cache.
      // Reconcile that safe state without hiding the original action failure.
      try {
        await refresh();
      } catch {
        /* Keep the original error visible. */
      }
    } finally {
      setPending(false);
    }
  }
  async function connect() {
    await perform(async () => {
      const data = await api("/connect", "POST", {});
      const url = new URL(data.authorizationUrl);
      if (url.origin !== "https://accounts.google.com")
        throw new Error("The authorization destination could not be verified.");
      window.location.assign(url.href);
    });
  }
  async function discoverAccounts() {
    await perform(async () => {
      const data = googleAccountsSchema.parse(await api("/accounts"));
      setAccounts(data.accounts);
      setAccountsTruncated(data.truncated);
      setDiscovered(true);
      setProfiles([]);
      setAccount("");
      setCandidate("");
    });
  }
  async function discoverProfiles(more = false) {
    if (!account) return;
    await perform(async () => {
      const params = new URLSearchParams({ accountName: account });
      if (more && nextPage) params.set("pageToken", nextPage);
      const data = googleLocationsSchema.parse(
        await api(`/locations?${params}`),
      );
      setProfiles((previous) =>
        more
          ? [
              ...previous,
              ...data.locations.filter(
                (p) =>
                  !previous.some((old) => old.candidateId === p.candidateId),
              ),
            ]
          : data.locations,
      );
      setNextPage(data.nextPageToken);
      setCandidate("");
      if (data.locations.length === 0 && !more)
        setNotice(
          "No available profiles were returned for this Google account.",
        );
    });
  }
  const status = state.connection?.status || "DISCONNECTED";
  const connected =
    status !== "DISCONNECTED" && status !== "REVOCATION_PENDING";
  const canDiscover =
    state.configured && connected && status !== "NEEDS_RECONNECT";
  return (
    <section
      className="rounded-lg border bg-card p-5 sm:p-6"
      aria-label="Google Business Profile connection"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <Link2 className="size-4" />
            Google Business Profile
          </div>
          {heading && (
            <h2 className="text-lg font-semibold tracking-tight">
              Connect the profile you manage
            </h2>
          )}
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Separate permission from Google sign-in. One profile is included;
            authorization does not enable reply publishing or AI.
          </p>
        </div>
        <Badge variant="outline">
          {!state.configured
            ? "Setup required"
            : status.replaceAll("_", " ").toLowerCase()}
        </Badge>
      </div>
      {!state.configured && (
        <p
          role="status"
          className="mt-5 rounded-md border border-dashed p-4 text-xs leading-relaxed text-muted-foreground"
        >
          The platform team needs to configure Business Profile access. No
          business account is connected by this action. You can finish the
          available setup steps meanwhile.
        </p>
      )}
      {state.connection?.errorCode && (
        <p className="mt-4 flex gap-2 rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {googleErrorMessage(state.connection.errorCode)}
        </p>
      )}
      {status === "REVOCATION_PENDING" && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {connectionMessages.REVOCATION_PENDING}
        </p>
      )}
      {state.connection?.retryAt && (
        <p className="mt-2 text-xs text-muted-foreground">
          Retry after{" "}
          {new Date(state.connection.retryAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}{" "}
          IST.
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          disabled={
            pending || !state.configured || status === "REVOCATION_PENDING"
          }
          onClick={connect}
        >
          <Link2 className="size-4" />
          {connected ? "Reconnect Google" : "Connect Google Business Profile"}
        </Button>
        {canDiscover && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={discoverAccounts}
          >
            <Store className="size-4" />
            Load Google accounts
          </Button>
        )}
        <Button
          variant="ghost"
          disabled={pending}
          onClick={() =>
            perform(async () => {
              await refresh();
              router.refresh();
              setNotice("Connection status refreshed.");
            })
          }
        >
          <RefreshCw className="size-4" />
          Refresh status
        </Button>
        {connected && (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => setConfirm(true)}
          >
            <Unplug className="size-4" />
            Disconnect
          </Button>
        )}
        {status === "REVOCATION_PENDING" && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              perform(async () => {
                accept(
                  googleBusinessStateSchema.parse(
                    await api("/revoke-retry", "POST", {}),
                  ),
                );
                router.refresh();
              })
            }
          >
            Retry permission removal
          </Button>
        )}
      </div>
      {discovered && (
        <div className="mt-5 space-y-4 border-t pt-5">
          <div>
            <label
              htmlFor={`google-account-${organizationId}`}
              className="mb-2 block text-xs font-medium"
            >
              Google account
            </label>
            <select
              id={`google-account-${organizationId}`}
              value={account}
              onChange={(e) => {
                setAccount(e.target.value);
                setProfiles([]);
                setCandidate("");
                setNextPage(null);
              }}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Choose an account</option>
              {accounts.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.accountName || a.name}
                </option>
              ))}
            </select>
            {accounts.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                No managed business accounts were returned. Check permissions in
                Google Business Profile.
              </p>
            )}
            {accountsTruncated && (
              <p className="mt-2 text-xs text-muted-foreground">
                Only a limited set of accounts was returned. Contact support if
                yours is missing.
              </p>
            )}
          </div>
          <Button
            variant="outline"
            disabled={pending || !account}
            onClick={() => discoverProfiles(false)}
          >
            Load profiles
          </Button>
          {profiles.length > 0 && (
            <div>
              <label
                htmlFor={`google-profile-${organizationId}`}
                className="mb-2 block text-xs font-medium"
              >
                Business profile
              </label>
              <select
                id={`google-profile-${organizationId}`}
                value={candidate}
                onChange={(e) => setCandidate(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Choose one profile</option>
                {profiles.map((p) => (
                  <option key={p.candidateId} value={p.candidateId}>
                    {p.title}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Profile choices expire after 10 minutes. Reload if a selection
                has expired.
              </p>
              <Button
                className="mt-3"
                disabled={pending || !candidate || !!state.location}
                onClick={() =>
                  perform(async () => {
                    const selected = googleBusinessStateSchema.parse(
                      await api("/location", "POST", {
                        candidateId: candidate,
                      }),
                    );
                    accept(selected);
                    setNotice(
                      selected.location?.syncStatus === "QUEUED" ||
                        selected.location?.syncStatus === "SYNCING"
                        ? "Profile selected. Initial review sync has been requested."
                        : "Profile selected. Check sync status below.",
                    );
                    router.refresh();
                  })
                }
              >
                Select this profile
              </Button>
              {!!state.location && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Clear the current selection before choosing a different
                  profile.
                </p>
              )}
            </div>
          )}
          {nextPage && (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => discoverProfiles(true)}
            >
              Load more profiles
            </Button>
          )}
        </div>
      )}
      {state.location && (
        <div className="mt-5 rounded-md border bg-muted/25 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">
                {state.location.title || "Selected Google profile"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Verification: {state.location.verification.toLowerCase()} ·
                Sync: {state.location.syncStatus.toLowerCase()}
              </p>
            </div>
            <ShieldCheck className="size-4 text-primary" />
          </div>
          {state.location.lastSyncAt && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Last sync:{" "}
              {new Date(state.location.lastSyncAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </p>
          )}
          {state.location.verification === "UNVERIFIED" && (
            <p className="mt-3 text-xs leading-relaxed">
              Verify this business in Google Business Profile before its reviews
              can be read.
            </p>
          )}
          {state.location.errorCode && (
            <p className="mt-3 text-xs leading-relaxed">
              {googleErrorMessage(state.location.errorCode)}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={
                pending ||
                busySync ||
                !connected ||
                status === "NEEDS_RECONNECT"
              }
              onClick={() =>
                perform(async () => {
                  await api("/sync", "POST", {});
                  setNotice(
                    "Review sync requested. Status will refresh while the job runs.",
                  );
                  await refresh();
                })
              }
            >
              <RefreshCw className="size-4" />
              {busySync ? "Sync in progress" : "Sync reviews"}
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() =>
                perform(async () => {
                  accept(
                    googleBusinessStateSchema.parse(
                      await api("/location", "DELETE"),
                    ),
                  );
                  setProfiles([]);
                  setCandidate("");
                  setNotice(
                    "Selected profile and cached reviews cleared. Google account authorization is retained.",
                  );
                  router.refresh();
                })
              }
            >
              Clear selected profile
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-destructive/40 p-3 text-xs leading-relaxed"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 text-xs leading-relaxed text-primary">
          {notice}
        </p>
      )}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Google Business Profile?</DialogTitle>
            <DialogDescription>
              Your selected profile and cached reviews will be removed. We will
              also request removal of the Google permission. Your ReviesNest
              login and trial dates stay unchanged.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setConfirm(false)}
            >
              Keep connection
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                perform(async () => {
                  accept(
                    googleBusinessStateSchema.parse(
                      await api("/disconnect", "POST", {}),
                    ),
                  );
                  setConfirm(false);
                  setAccounts([]);
                  setProfiles([]);
                  setDiscovered(false);
                  router.refresh();
                })
              }
            >
              Disconnect Google
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
