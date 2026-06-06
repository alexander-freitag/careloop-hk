"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HeartPulse, RotateCcw, Bell, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/AppProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/alerts", label: "Alerts" },
  { href: "/business", label: "Business" },
  { href: "/honesty", label: "Honesty" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { alerts, busy, resetDemo, runRiskyCheckIn } = useApp();
  const openAlerts = alerts.filter((a) => a.status !== "resolved").length;

  async function handleRisky() {
    const id = await runRiskyCheckIn();
    if (id) router.push(`/patients/${id}`);
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">CareLoop HK</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {item.href === "/alerts" && openAlerts > 0 && (
                  <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                    {openAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetDemo} disabled={busy} className="gap-1.5">
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Reset demo</span>
          </Button>
          <Button size="sm" onClick={handleRisky} disabled={busy} className="gap-1.5">
            <Zap className="size-4" />
            <span className="hidden sm:inline">Run risky check-in</span>
          </Button>
          <Link
            href="/alerts"
            className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground sm:hidden"
          >
            <Bell className="size-5" />
            {openAlerts > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {openAlerts}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
