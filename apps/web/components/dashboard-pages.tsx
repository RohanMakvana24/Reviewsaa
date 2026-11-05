"use client";
import type { TrialSummary } from "@reviesnest/contracts";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  ChevronRight,
  Clock3,
  CreditCard,
  Link2,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Users,
  WifiOff,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { reviews, clients, type DemoReview } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
          {eyebrow}
        </p>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
function Sample() {
  return (
    <Badge
      variant="outline"
      className="font-normal text-[10px] text-muted-foreground"
    >
      Sample data
    </Badge>
  );
}
function Stars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      className="flex gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          aria-hidden="true"
          key={i}
          className={cn(
            "size-3.5",
            i < rating
              ? "fill-amber-500 text-amber-500"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}
function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Star;
}) {
  return (
    <Card className="gap-3 rounded-lg py-5 shadow-none">
      <CardContent className="px-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className="text-[29px] font-semibold leading-none tracking-tight tabular-nums">
          {value}
        </p>
        <p className="mt-3 text-[11px] text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center">
      <span className="mb-4 grid size-11 place-items-center rounded-xl border bg-muted/40">
        <Search className="size-5 text-muted-foreground" />
      </span>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
function ConnectionNotice({
  service = "Google Business Profile",
}: {
  service?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
      <WifiOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs font-semibold">{service} is not connected</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          This is a UI preview. Live connection and authorization will be
          implemented in a later phase.
        </p>
      </div>
    </div>
  );
}
function Trend() {
  const values = [
    0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 3, 0, 1,
    0, 1, 1,
  ];
  return (
    <Card className="gap-0 rounded-lg py-0 shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b px-5 py-5">
        <div>
          <CardTitle className="text-sm">Your reputation, over time</CardTitle>
          <CardDescription className="mt-1.5 text-xs">
            New reviews received · November sample
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-sm bg-primary" />
          <span className="text-[11px] text-muted-foreground">Reviews</span>
          <Sample />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-5">
        <div className="flex gap-3">
          <div className="flex h-44 flex-col justify-between pb-1 text-[10px] tabular-nums text-muted-foreground">
            <span>3</span>
            <span>2</span>
            <span>1</span>
            <span>0</span>
          </div>
          <div
            className="relative h-44 min-w-0 flex-1 border-b"
            role="img"
            aria-label="18 new reviews across 28 sample November days, ranging from zero to three per day. Sample data only."
          >
            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="border-t border-dashed" />
              <div className="border-t border-dashed" />
              <div className="border-t border-dashed" />
              <div />
            </div>
            <div className="absolute inset-0 flex items-end gap-[3px] sm:gap-[6px]">
              {values.map((v, i) => (
                <span
                  key={i}
                  className={cn(
                    "z-10 flex-1 rounded-t-[2px]",
                    i > 23 ? "bg-primary" : "bg-primary/65",
                  )}
                  style={{ height: `${(v / 3) * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="ml-7 mt-3 flex justify-between text-[10px] text-muted-foreground">
          <span>Nov 01</span>
          <span>Nov 07</span>
          <span>Nov 14</span>
          <span>Nov 21</span>
          <span>Nov 28</span>
        </div>
        <p className="mt-5 flex items-center gap-1.5 text-xs">
          <TrendingUp className="size-3.5 text-primary" />
          <span className="font-medium">A steady stream of feedback</span>
          <span className="hidden text-muted-foreground sm:inline">
            helps you see what matters.
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
function ReviewList({
  items = reviews,
  compact = false,
}: {
  items?: DemoReview[];
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<DemoReview | null>(null);
  const [draft, setDraft] = useState("");
  return (
    <>
      <div className="divide-y">
        {items.map((r) => (
          <article key={r.id} className="px-5 py-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">
                {r.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold">{r.name}</h3>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {r.date}
                    </p>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                <p
                  className={cn(
                    "mt-3 text-[13px] leading-relaxed",
                    compact && "line-clamp-2",
                  )}
                >
                  {r.text}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] font-medium",
                      r.replied ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {r.replied ? (
                      <CheckCheck className="size-3.5" />
                    ) : (
                      <Clock3 className="size-3.5" />
                    )}
                    {r.replied ? "Reply added · Sample" : "Awaiting a reply"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => {
                      setSelected(r);
                      setDraft(
                        r.replied
                          ? "Thank you for coming back, Neha. We’re so glad you enjoy the coffee and cinnamon rolls!"
                          : "",
                      );
                    }}
                  >
                    {r.replied ? "View sample reply" : "Preview reply"}
                    <ArrowUpRight className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply preview</DialogTitle>
            <DialogDescription>
              Practice with sample feedback. This reply will not be sent to
              Google or saved.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="mb-2 flex justify-between">
                  <p className="text-sm font-semibold">{selected.name}</p>
                  <Stars rating={selected.rating} />
                </div>
                <p className="text-sm leading-relaxed">{selected.text}</p>
              </div>
              <label htmlFor="reply-draft" className="text-sm font-medium">
                Your response
              </label>
              <textarea
                id="reply-draft"
                className="min-h-32 w-full rounded-md border bg-background p-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Write a thoughtful response…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                AI generation and publishing are unavailable until integrations
                are connected.
              </p>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close preview
            </Button>
            <Button disabled>Publishing not connected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function OwnerOverview({
  name,
  trial,
}: {
  name: string;
  trial: TrialSummary | null;
}) {
  return (
    <>
      <Heading
        eyebrow="Your business at a glance"
        title={`Welcome back, ${name}`}
        description="A little attention to every review goes a long way."
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/reviews">
              <MessageSquareText />
              Open review inbox
            </Link>
          </Button>
        }
      />
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xs font-medium text-muted-foreground">
          November snapshot
        </h2>
        <Sample />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Average rating"
          value="4.8"
          detail="Across 128 sample reviews"
          icon={Star}
        />
        <Metric
          label="Total reviews"
          value="128"
          detail="18 new reviews this sample month"
          icon={MessageSquareText}
        />
        <Metric
          label="Awaiting a reply"
          value="3"
          detail="A chance to start a conversation"
          icon={Clock3}
        />
        <Metric
          label="Reply rate"
          value="94%"
          detail="Illustrative response coverage"
          icon={CheckCheck}
        />
      </div>
      <div className="mb-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Trend />
        <Card className="gap-0 rounded-lg py-0 shadow-none">
          <CardHeader className="border-b px-5 py-5">
            <CardTitle className="text-sm">Your AI assistant</CardTitle>
            <CardDescription className="mt-1.5 text-xs">
              Thoughtful replies, with your approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <span className="mb-4 grid size-10 place-items-center rounded-lg bg-accent text-primary">
              <Sparkles className="size-5" />
            </span>
            <h3 className="text-sm font-semibold">
              Your voice. A little less effort.
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Preview how AI can help you acknowledge the good and respond with
              care.
            </p>
            <div className="mb-2 mt-5 flex justify-between text-[11px]">
              <span className="text-muted-foreground">
                Your trial allowance
              </span>
              <span className="font-semibold">
                {trial ? `${trial.used} / ${trial.allowance}` : "Unavailable"}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${trial && trial.allowance ? Math.min(100, (trial.used / trial.allowance) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {trial
                ? `${trial.remaining} generations remaining · AI not connected yet`
                : "No trial is available for this workspace"}
            </p>
            <Button className="mt-5 w-full" asChild>
              <Link href="/dashboard/ai-replies">
                Explore AI workspace <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card className="mb-6 gap-0 rounded-lg py-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-5">
          <div>
            <CardTitle className="text-sm">
              Every review is a conversation
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs">
              Your latest feedback · Sample reviews
            </CardDescription>
          </div>
          <Link
            href="/dashboard/reviews"
            className="flex items-center gap-1 text-xs font-medium text-primary"
          >
            View all <ChevronRight className="size-3.5" />
          </Link>
        </CardHeader>
        <ReviewList items={reviews.slice(0, 3)} compact />
      </Card>
      <ConnectionNotice />
    </>
  );
}
export function ReviewsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const shown = reviews.filter(
    (r) =>
      `${r.name} ${r.text}`.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "unanswered" && !r.replied) ||
        (filter === "replied" && r.replied) ||
        (filter === "low" && r.rating <= 3)),
  );
  return (
    <>
      <Heading
        eyebrow="Listen. Respond. Connect."
        title="Review inbox"
        description="Give every customer’s experience the attention it deserves."
        action={<Sample />}
      />
      <ConnectionNotice />
      <Card className="mt-6 gap-0 rounded-lg py-0 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Search sample reviews"
              placeholder="Search reviews or customers…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter reviews"
            className="h-9 rounded-md border bg-card px-3 text-xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All reviews</option>
            <option value="unanswered">Awaiting reply</option>
            <option value="replied">Replied</option>
            <option value="low">1–3 stars</option>
          </select>
        </div>
        <p className="border-b px-5 py-3 text-[11px] text-muted-foreground">
          {shown.length} sample {shown.length === 1 ? "review" : "reviews"}
        </p>
        {shown.length ? (
          <ReviewList items={shown} />
        ) : (
          <Empty
            title="No reviews match your filters"
            description="Try another name, keyword, or review status."
          />
        )}
      </Card>
    </>
  );
}
export function AiPage() {
  return (
    <>
      <Heading
        eyebrow="A thoughtful starting point"
        title="AI replies"
        description="Help customers feel heard, while keeping your voice in every response."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Your reply workspace
            </CardTitle>
            <CardDescription>
              Draft, review, then publish—with you in control.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectionNotice service="Gemini AI" />
            <Empty
              title="Your drafts will appear here"
              description="Connect your Business Profile and enable AI in a later phase to start drafting responses. No AI requests are made in this preview."
            />
            <Button variant="outline" asChild>
              <Link href="/dashboard/reviews">
                Explore sample reviews <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="h-fit rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">
              Designed for your approval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              "AI prepares a suggested reply",
              "You review the words and tone",
              "Only an authorized reply is published",
            ].map((t, i) => (
              <div className="flex items-start gap-3" key={t}>
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <p className="text-xs leading-relaxed">{t}</p>
              </div>
            ))}
            <div className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              Automatic public replies are off. They require separate policy
              validation and explicit authorization.
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
export function QrPage() {
  const [name, setName] = useState("Olive & Ember");
  const [greeting, setGreeting] = useState(
    "Your experience means the world to us.",
  );
  return (
    <>
      <Heading
        eyebrow="Turn a visit into a conversation"
        title="Your QR page"
        description="A simple, welcoming place to ask customers for honest feedback."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Page appearance</CardTitle>
            <CardDescription>
              Try the live local preview. Changes are not published or saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="business-name" className="text-xs font-medium">
                Business name
              </label>
              <Input
                id="business-name"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="greeting" className="text-xs font-medium">
                Welcome message
              </label>
              <Input
                id="greeting"
                value={greeting}
                maxLength={140}
                onChange={(e) => setGreeting(e.target.value)}
              />
            </div>
            <ConnectionNotice />
            <p className="text-xs leading-relaxed text-muted-foreground">
              A permanent review link and downloadable QR will be available
              after the QR feature is implemented. All customers will have equal
              access to leave a Google review.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button disabled>
                <Link2 />
                Publishing not connected
              </Button>
              <Button variant="outline" disabled>
                <ArrowDownToLine />
                QR not available
              </Button>
            </div>
          </CardContent>
        </Card>
        <div>
          <p className="mb-3 text-center text-[11px] font-medium text-muted-foreground">
            CUSTOMER PAGE · LOCAL PREVIEW
          </p>
          <div className="mx-auto max-w-[320px] rounded-[28px] border-[7px] border-foreground/80 bg-card px-5 pb-8 pt-10 text-center shadow-sm">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent font-semibold text-primary">
              OE
            </span>
            <h2 className="mt-5 break-words text-xl font-semibold">
              {name || "Your business"}
            </h2>
            <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground">
              {greeting || "Share your experience with us."}
            </p>
            <div className="my-6 flex justify-center">
              <Stars rating={5} />
            </div>
            <Button disabled className="w-full">
              Google review · Not connected
            </Button>
            <p className="mt-4 text-[11px] text-muted-foreground">
              Honest feedback is always welcome.
            </p>
            <div className="mt-10 border-t pt-4 text-[10px] text-muted-foreground">
              Powered by ReviesNest · Preview
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export function SettingsPage() {
  const [tone, setTone] = useState("Warm and professional");
  const [language, setLanguage] = useState("English");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("reviesnest-preview-preferences");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (
        [
          "Warm and professional",
          "Friendly and casual",
          "Brief and formal",
        ].includes(saved.tone)
      )
        setTone(saved.tone);
      if (["English", "Gujarati", "Hindi"].includes(saved.language))
        setLanguage(saved.language);
    } catch {
      /* Invalid local preview data falls back to defaults. */
    }
  }, []);
  return (
    <>
      <Heading
        eyebrow="Make it feel like you"
        title="Business settings"
        description="Shape how your business shows up and responds."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Reply preferences</CardTitle>
            <CardDescription>
              Local preview only. Preferences are not saved to an account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  localStorage.setItem(
                    "reviesnest-preview-preferences",
                    JSON.stringify({ tone, language }),
                  );
                  toast.success("Preview preferences saved on this device", {
                    description:
                      "These settings do not affect real AI replies or an account.",
                  });
                } catch {
                  toast.error("Unable to save in this browser");
                }
              }}
            >
              <div className="space-y-2">
                <label htmlFor="tone" className="text-xs font-medium">
                  Business tone
                </label>
                <select
                  id="tone"
                  className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option>Warm and professional</option>
                  <option>Friendly and casual</option>
                  <option>Brief and formal</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="language" className="text-xs font-medium">
                  Preferred reply language
                </label>
                <select
                  id="language"
                  className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option>English</option>
                  <option>Gujarati</option>
                  <option>Hindi</option>
                </select>
              </div>
              <Button type="submit">
                <Settings2 />
                Save preview preferences
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="h-fit rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">Connected accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium">
              Manage your Google connection above.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Google sign-in and Business Profile authorization are separate.
              Only profiles returned for an authorized account can be selected.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
function ClientTable({ filtered = clients }: { filtered?: typeof clients }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-5">Business</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>AI usage</TableHead>
          <TableHead className="pr-5">Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((c) => (
          <TableRow key={c.name}>
            <TableCell className="py-4 pl-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted/40 text-xs font-semibold">
                  {c.initials}
                </span>
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {c.category}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-xs">{c.owner}</TableCell>
            <TableCell>
              <Badge
                variant={c.plan === "Basic" ? "secondary" : "outline"}
                className={c.plan === "Expired" ? "text-muted-foreground" : ""}
              >
                {c.plan}
              </Badge>
            </TableCell>
            <TableCell className="text-xs tabular-nums">{c.usage}</TableCell>
            <TableCell className="pr-5 text-xs text-muted-foreground">
              {c.joined}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
function Readiness() {
  return (
    <Card className="h-fit gap-0 rounded-lg py-0 shadow-none">
      <CardHeader className="border-b px-5 py-5">
        <CardTitle className="text-sm">Integration readiness</CardTitle>
        <CardDescription className="mt-1.5 text-xs">
          Implementation status, not live monitoring.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-1">
        {[
          ["Google Business Profile", "Authorization and API access required"],
          ["Gemini AI", "Provider integration pending"],
          ["Razorpay", "One-time checkout pending"],
        ].map(([name, detail]) => (
          <div
            key={name}
            className="flex items-start gap-3 border-b py-4 last:border-b-0"
          >
            <span className="mt-1 size-2 shrink-0 rounded-full bg-muted-foreground/50" />
            <div>
              <p className="text-xs font-medium">{name}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
export function AdminOverview() {
  return (
    <>
      <Heading
        eyebrow="Platform workspace"
        title="The bigger picture"
        description="A clear view of your businesses, subscriptions, and what needs attention."
        action={
          <Button variant="outline" asChild>
            <Link href="/admin/clients">
              <Users />
              View clients
            </Link>
          </Button>
        }
      />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-medium text-muted-foreground">
          Illustrative platform snapshot
        </h2>
        <Sample />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Businesses"
          value="24"
          detail="Sample organizations on the platform"
          icon={Store}
        />
        <Metric
          label="Active trials"
          value="8"
          detail="Sample 14-day trial workspaces"
          icon={Clock3}
        />
        <Metric
          label="Paid clients"
          value="12"
          detail="Illustrative Basic plan customers"
          icon={Users}
        />
        <Metric
          label="Monthly collections"
          value="₹1,188"
          detail="Sample captured payments, not profit"
          icon={CreditCard}
        />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="min-w-0 gap-0 rounded-lg py-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-5">
            <div>
              <CardTitle className="text-sm">Recent businesses</CardTitle>
              <CardDescription className="mt-1.5 text-xs">
                People building their local reputation.
              </CardDescription>
            </div>
            <Sample />
          </CardHeader>
          <ClientTable />
          <div className="border-t px-5 py-4">
            <Link
              href="/admin/clients"
              className="flex items-center gap-1 text-xs font-medium text-primary"
            >
              Explore sample clients <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>
        <Readiness />
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-lg border bg-card p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <h2 className="text-sm font-semibold">
            Workspace access is protected
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Server-verified sessions and Super Admin permissions protect this
            workspace. The figures above remain illustrative; live client and
            payment management will be added in their respective phases.
          </p>
        </div>
      </div>
    </>
  );
}
export function ClientsPage() {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const filtered = clients.filter(
    (c) =>
      `${c.name} ${c.owner} ${c.category}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (plan === "all" || c.plan === plan),
  );
  return (
    <>
      <Heading
        eyebrow="Behind every review, a business"
        title="Clients"
        description="Explore the sample client directory. No real customer data is loaded."
        action={<Sample />}
      />
      <Card className="gap-0 rounded-lg py-0 shadow-none">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search businesses or owners…"
              aria-label="Search sample clients"
              className="pl-9"
            />
          </div>
          <select
            aria-label="Filter clients by plan"
            className="h-9 rounded-md border bg-card px-3 text-xs"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="all">All plans</option>
            <option>Trial</option>
            <option>Basic</option>
            <option>Expired</option>
          </select>
        </div>
        {filtered.length ? (
          <ClientTable filtered={filtered} />
        ) : (
          <Empty
            title="No matching businesses"
            description="Try a different name, city, or plan filter."
          />
        )}
        <p className="border-t px-5 py-3 text-[11px] text-muted-foreground">
          {filtered.length} sample businesses · Client actions are not connected
        </p>
      </Card>
    </>
  );
}
export function AdminPlansPage() {
  return (
    <>
      <Heading
        eyebrow="A simple starting point"
        title="Plans & allowances"
        description="Review the proposed entry offer before billing is implemented."
        action={<Badge variant="outline">Read-only preview</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-base">14-day trial</CardTitle>
            <CardDescription>
              A no-payment introduction for a single business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 text-3xl font-semibold">
              ₹0{" "}
              <span className="text-xs font-normal text-muted-foreground">
                for 14 days
              </span>
            </div>
            <dl className="space-y-3 text-xs">
              {[
                ["Profiles", "1 Google Business Profile"],
                ["AI allowance", "20 generations total · Proposed"],
                ["After expiry", "Manual purchase required"],
                ["Automatic charge", "None"],
              ].map(([key, val]) => (
                <div
                  key={key}
                  className="flex flex-wrap justify-between gap-2 border-b pb-3"
                >
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-primary/30 shadow-none">
          <CardHeader>
            <div className="flex justify-between gap-2">
              <CardTitle className="text-base">Basic</CardTitle>
              <Badge variant="secondary">Proposed</Badge>
            </div>
            <CardDescription>
              Affordable review management for local businesses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 text-3xl font-semibold">
              ₹99{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / month
              </span>
            </div>
            <dl className="space-y-3 text-xs">
              {[
                ["Profiles", "1 Google Business Profile"],
                ["AI allowance", "30 generations / month · Proposed"],
                ["Billing", "One-time Razorpay payment"],
                ["Renewal", "Owner pays manually"],
              ].map(([key, val]) => (
                <div
                  key={key}
                  className="flex flex-wrap justify-between gap-2 border-b pb-3"
                >
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
      <p className="mt-5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
        Pricing, allowances, tax handling, and plan editing will be finalized in
        the billing phase. Annual pricing and multi-profile paid tiers are not
        finalized. AutoPay is outside the current scope.
      </p>
    </>
  );
}
export function PaymentsPage() {
  return (
    <>
      <Heading
        eyebrow="Verified payments, clear records"
        title="Payments"
        description="A preview of transaction reporting. No live Razorpay orders have been created."
        action={<Sample />}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Metric
          label="Sample collections"
          value="₹1,188"
          detail="Illustrative month-to-date total"
          icon={CreditCard}
        />
        <Metric
          label="Sample payments"
          value="12"
          detail="Illustrative captured transactions"
          icon={CheckCheck}
        />
        <Metric
          label="Renewal method"
          value="Manual"
          detail="No mandates or automatic deduction"
          icon={Clock3}
        />
      </div>
      <Card className="min-w-0 gap-0 rounded-lg py-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Illustrative transactions</CardTitle>
          <CardDescription className="text-xs">
            Demonstration rows only. Not receipts or actual payment
            confirmations.
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Reference</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              [
                "DEMO-1002",
                "The Daily Grind",
                "₹99",
                "Captured",
                "Nov 4, 2026",
              ],
              ["DEMO-1001", "Bloom Studio", "₹99", "Captured", "Nov 3, 2026"],
            ].map((row) => (
              <TableRow key={row[0]}>
                {row.map((v, i) => (
                  <TableCell
                    key={i}
                    className={cn(
                      "py-4 text-xs",
                      i === 0 && "pl-5 font-mono text-muted-foreground",
                    )}
                  >
                    {i === 3 ? (
                      <Badge variant="secondary">{v} · Sample</Badge>
                    ) : (
                      v
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t p-5">
          <ConnectionNotice service="Razorpay" />
        </div>
      </Card>
    </>
  );
}
export function HealthPage() {
  return (
    <>
      <Heading
        eyebrow="Know what’s connected"
        title="System health"
        description="Integration implementation status. Live monitoring is not connected in this UI."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Readiness />
        <Card className="h-fit rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">Infrastructure checks</CardTitle>
            <CardDescription className="text-xs">
              Backend checks exist separately; this page does not poll them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["API liveness", "/health/live"],
              ["MySQL + Redis readiness", "/health/ready"],
              ["Background jobs", "Infrastructure heartbeat"],
            ].map(([name, path]) => (
              <div
                key={name}
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-4"
              >
                <div>
                  <p className="text-xs font-medium">{name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {path}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Not monitored here
                </Badge>
              </div>
            ))}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Do not treat this screen as an uptime guarantee. Live operational
              metrics and permission-protected support actions are planned for
              later phases.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
