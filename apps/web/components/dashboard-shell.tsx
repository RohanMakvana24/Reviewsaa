"use client";
import { TrialStatus } from "@/components/trial-status";
import type { Workspace } from "@reviesnest/contracts";
import type { AuthSession } from "@reviesnest/contracts";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowLeftRight,
  LogOut,
  ArrowUpRight,
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Moon,
  QrCode,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Sun,
  Users,
  Activity,
  Layers3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
const ownerLinks = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Reviews", href: "/dashboard/reviews", icon: MessageSquareText },
  { title: "AI replies", href: "/dashboard/ai-replies", icon: Sparkles },
  { title: "QR page", href: "/dashboard/qr-page", icon: QrCode },
  { title: "Plan & billing", href: "/dashboard/plan", icon: CreditCard },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];
const adminLinks = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Clients", href: "/admin/clients", icon: Users },
  {
    title: "Contact inquiries",
    href: "/admin/inquiries",
    icon: MessageSquareText,
  },
  { title: "Plans", href: "/admin/plans", icon: Layers3 },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "System health", href: "/admin/system-health", icon: Activity },
];
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle color theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="light-only size-4" />
      <Sun className="dark-only size-4" />
    </Button>
  );
}
export function DashboardShell({
  children,
  session,
  workspace,
}: {
  children: React.ReactNode;
  session: AuthSession;
  workspace?: Workspace | null;
}) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  const links = admin ? adminLinks : ownerLinks;
  const active = links.find((l) => l.href === pathname);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  async function logout() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": session.csrfToken },
      });
      if (!response.ok && response.status !== 401 && response.status !== 403)
        throw new Error("Logout failed");
      window.location.assign("/login");
    } catch {
      toast.error("Could not sign out. Please retry.");
      setLoggingOut(false);
    }
  }
  const sidebar = (
    <div className="flex h-full flex-col">
      <Link
        href={admin ? "/admin" : "/dashboard"}
        onClick={() => setOpen(false)}
        className="flex h-[77px] items-center gap-2.5 px-6 font-semibold tracking-tight text-xl"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Star className="size-4" fill="currentColor" />
        </span>
        ReviesNest
        <span className="ml-0.5 size-1.5 rounded-full bg-primary" />
      </Link>
      <div className="mx-4 mb-7 flex items-center gap-3 rounded-lg border bg-background px-3 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-card text-sm font-semibold">
          {admin ? <ShieldCheck className="size-5 text-primary" /> : "OE"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">
            {admin
              ? "Platform workspace"
              : session.organizations[0]?.name || "Your workspace"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {admin ? "Super Admin" : "Business Owner"}
          </p>
        </div>
      </div>
      <p className="px-6 pb-3 text-[10px] font-semibold tracking-[0.13em] text-muted-foreground">
        {admin ? "PLATFORM" : "WORKSPACE"}
      </p>
      <nav
        aria-label={admin ? "Admin navigation" : "Owner navigation"}
        className="space-y-1 px-3"
      >
        {links.map(({ title, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={pathname === href ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              pathname === href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )}
          >
            <Icon className="size-[17px]" />
            {title}
          </Link>
        ))}
      </nav>
      <div className="mt-auto px-4 pb-5 pt-10">
        {!admin && (
          <div className="mb-5 rounded-lg border bg-background p-3.5">
            <div className="flex items-center gap-2 font-medium text-xs">
              <Sparkles className="size-3.5 text-primary" />A little help, a
              better reply.
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Explore thoughtful responses in your AI workspace.
            </p>
            <Link
              href="/dashboard/ai-replies"
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary"
            >
              Explore AI replies <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() =>
            toast.info("Development preview", {
              description:
                "Use the Contact page for support and account requests.",
            })
          }
        >
          <CircleHelp />
          Help & support
        </Button>
        <div className="mt-3 flex items-center gap-3 border-t px-1 pt-4">
          <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold">
            {session.user.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-xs font-semibold">{session.user.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {admin ? "Super Admin" : "Business Owner"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-card focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] border-r bg-card lg:block">
        {sidebar}
      </aside>
      <div className="min-w-0 lg:pl-[240px]">
        <header className="flex h-[77px] items-center justify-between gap-2 border-b bg-card px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] gap-0 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Navigate the dashboard preview.
                </SheetDescription>
                {sidebar}
              </SheetContent>
            </Sheet>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {admin ? "Platform" : "Workspace"}
            </span>
            <ChevronRight className="hidden size-3 text-muted-foreground sm:block" />
            <span className="truncate text-xs font-medium">
              {active?.title || "Dashboard"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Badge
              variant="outline"
              className="hidden text-[10px] sm:inline-flex"
            >
              UI preview
            </Badge>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Show notifications"
              onClick={() =>
                toast.info("You’re all caught up", {
                  description:
                    "This preview has no live notifications. Review and renewal alerts come in a later phase.",
                })
              }
            >
              <Bell className="size-4" />
            </Button>
            <span className="mx-1 h-5 border-l" />
            {session.user.role === "SUPER_ADMIN" && (
              <Link
                href={admin ? "/dashboard" : "/admin"}
                className="flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowLeftRight className="size-3.5" />
                <span>{admin ? "Owner" : "Admin"} workspace</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              disabled={loggingOut}
              onClick={logout}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <section
          aria-label="Preview status"
          className="flex items-start gap-2 border-b border-dashed bg-muted/40 px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground sm:px-8"
        >
          <Store className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <strong className="font-semibold text-foreground">
              Workspace status.
            </strong>{" "}
            Google reviews are shown only after authorization and successful
            sync. AI generation, reply publishing and payments are not enabled.
            Admin preview figures are labelled separately.
          </span>
        </section>
        <main
          id="main-content"
          className="page-enter mx-auto max-w-[1540px] px-4 py-6 sm:px-8 sm:py-8"
          key={pathname}
        >
          {!admin && workspace && pathname !== "/dashboard/plan" && (
            <TrialStatus workspace={workspace} compact />
          )}
          {children}
        </main>
        <footer className="mx-4 flex flex-wrap justify-between gap-2 border-t py-5 text-[11px] text-muted-foreground sm:mx-8">
          <span>© 2026 ReviesNest · Development preview</span>
          <span>Built for the businesses around us.</span>
        </footer>
      </div>
    </div>
  );
}
