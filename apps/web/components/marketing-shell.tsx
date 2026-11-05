"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/dashboard-shell";
const links = [
  ["Features", "/features"],
  ["Pricing", "/pricing"],
  ["FAQs", "/faq"],
  ["Contact", "/contact"],
];
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="market-header">
      <div className="market-wrap flex h-20 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-semibold tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Star className="size-4" fill="currentColor" />
          </span>
          ReviesNest
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 text-sm md:flex"
        >
          {links.map(([name, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              className="market-nav-link"
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden px-3 py-2 text-sm font-medium sm:inline-flex"
          >
            Sign in
          </Link>
          <span className="hidden sm:inline-flex">
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Start your trial <ArrowUpRight className="size-3.5" />
            </Link>
          </span>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="md:hidden"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>Explore ReviesNest</SheetTitle>
              <SheetDescription>
                A little more care for your business reputation.
              </SheetDescription>
              <nav
                aria-label="Mobile navigation"
                className="mt-6 flex flex-col gap-5"
              >
                {links.map(([name, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="text-base font-medium"
                  >
                    {name}
                  </Link>
                ))}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={buttonVariants()}
                >
                  Start your trial
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-sm"
                >
                  Already have an account? Sign in
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
export function MarketingFooter() {
  return (
    <footer className="market-footer">
      <div className="market-wrap">
        <div className="grid gap-8 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Star className="size-4 text-primary" />
              ReviesNest
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Made for the businesses that make a neighborhood feel like home.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Early access · Built with real feedback in mind.
            </p>
          </div>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest">
              Explore
            </p>
            <nav
              aria-label="Footer product navigation"
              className="grid gap-3 text-sm"
            >
              {links.map(([name, href]) => (
                <Link key={href} href={href}>
                  {name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest">
              The details
            </p>
            <nav aria-label="Policies" className="grid gap-3 text-sm">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms of use</Link>
              <Link href="/refund-policy">Refunds & cancellation</Link>
              <Link href="/login">Your workspace</Link>
            </nav>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t py-5 text-xs text-muted-foreground">
          <span>© 2026 ReviesNest. Working brand.</span>
          <span>Real experiences. Thoughtful responses.</span>
        </div>
      </div>
    </footer>
  );
}
