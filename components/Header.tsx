"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, Bell } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/alerts", label: "Alerts" },
  { href: "/business", label: "Business" },
  { href: "/presentation", label: "Presentation" },
  { href: "/honesty", label: "Honesty" },
];

export function Header() {
  const pathname = usePathname();
  const { alerts } = useApp();
  const openAlerts = alerts.filter((a) => a.status !== "resolved").length;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">CareLoop HK</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
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

        <Link
          href="/alerts"
          aria-label={`Alerts${openAlerts ? ` (${openAlerts} open)` : ""}`}
          className="relative ml-auto flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
        >
          <Bell className="size-5" />
          {openAlerts > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
              {openAlerts}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
