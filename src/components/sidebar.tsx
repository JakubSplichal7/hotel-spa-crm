"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Handshake,
  Activity,
  CheckSquare,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Lock,
  Unlock,
  SkipForward,
  ImageOff,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { useBackground } from "@/components/background-provider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Clients", icon: Building2 },
  { href: "/deals", label: "Offers", icon: Handshake },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    enabled,
    locked,
    index,
    count,
    toggleEnabled,
    toggleLocked,
    next,
  } = useBackground();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b p-6">
        <h1 className="text-lg font-bold text-primary">Hotel & Spa CRM</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {ROLE_LABELS[profile.role]}
        </p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {profile.role === "admin" && (
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        )}
      </nav>

      <div className="border-t p-4">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Background
        </p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={toggleEnabled}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {enabled ? (
              <ImageOff className="h-4 w-4" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            {enabled ? "Photos off" : "Photos on"}
          </button>
          <button
            type="button"
            onClick={toggleLocked}
            disabled={!enabled}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              enabled
                ? "text-muted-foreground"
                : "cursor-not-allowed text-muted-foreground/40"
            )}
          >
            {locked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
            {locked ? "Unlock photo" : "Lock photo"}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!enabled}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              enabled
                ? "text-muted-foreground"
                : "cursor-not-allowed text-muted-foreground/40"
            )}
          >
            <SkipForward className="h-4 w-4" />
            Next photo
            {enabled && (
              <span className="ml-auto text-xs tabular-nums opacity-70">
                {index + 1}/{count}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="border-t p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium">{profile.full_name}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
