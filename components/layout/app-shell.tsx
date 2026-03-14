"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BarChart3, Building2, History, LogOut, Menu, ReceiptText, X } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useTheme } from "@/components/shared/theme-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import type { House, Viewer } from "@/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/houses", label: "Houses", icon: Building2 },
  { href: "/history", label: "History", icon: History }
];

export function AppShell({
  viewer,
  houses,
  children
}: {
  viewer: Viewer;
  houses: House[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const currentPath = pathname ?? "";
  const router = useRouter();
  const { setTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileNavOpen]);

  async function handleLogout() {
    setTheme("light");

    if (viewer.isDemo) {
      router.push("/");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  function SidebarContent() {
    return (
      <>
        <div className="flex items-start justify-between gap-4">
          <Logo tone="light" />
          <ThemeToggle light />
        </div>

        <p className="mt-8 text-sm text-blue-100/80">
          Manage multiple houses, lock monthly snapshots, and share finalized bills publicly.
        </p>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-white text-ink shadow-lg shadow-black/10"
                    : "text-blue-50/90 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="max-w-xs break-words text-sm font-semibold text-white sm:text-base md:text-lg lg:text-sm xl:text-base">{viewer.name || "Admin"}</p>
              <p className="max-w-xs break-words text-xs text-blue-100/75">{viewer.email}</p>
            </div>
          </div>
          <Button variant="secondary" className="mt-4 w-full bg-white text-ink hover:bg-blue-50" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {viewer.isDemo ? "Exit demo" : "Logout"}
          </Button>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/75">Your houses</p>
          <div className="space-y-2">
            {houses.map((house) => (
              <Link
                key={house.id}
                href={`/houses/${house.id}`}
                className="block rounded-2xl border border-white/14 px-4 py-3 text-sm text-blue-50 transition hover:border-white/24 hover:bg-white/8"
              >
                {house.name}
              </Link>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-950 dark:text-slate-100 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-4 py-4 lg:h-full lg:px-6">
        <div className="mb-4 flex items-center justify-between rounded-[28px] bg-brand-hero px-4 py-3 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] dark:bg-brand-hero-dark lg:hidden">
          <Logo tone="light" />
          <div className="flex items-center gap-2">
            <ThemeToggle light />
            <button
              type="button"
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMobileNavOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-2rem)] gap-6 lg:h-full lg:min-h-0 lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden">
          <aside className="hidden h-full rounded-[32px] bg-brand-hero px-6 py-6 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] dark:bg-brand-hero-dark lg:block lg:overflow-y-auto lg:pr-4">
            <SidebarContent />
          </aside>

          <main className="space-y-6 py-2 lg:min-h-0 lg:overflow-y-auto lg:pr-2">{children}</main>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition lg:hidden",
          mobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileNavOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[360px] overflow-y-auto bg-brand-hero px-6 py-6 text-white shadow-2xl transition-transform duration-300 dark:bg-brand-hero-dark lg:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!mobileNavOpen}
      >
        <div className="flex items-center justify-between gap-4">
          <Logo tone="light" />
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6">
          <SidebarContent />
        </div>
      </aside>
    </div>
  );
}
