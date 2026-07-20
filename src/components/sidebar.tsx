"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Handshake,
  PartyPopper,
  Activity,
  CheckSquare,
  CalendarDays,
  Lightbulb,
  BarChart3,
  Settings,
  LogOut,
  Lock,
  Unlock,
  SkipForward,
  ImageOff,
  ImageIcon,
  Maximize2,
  Minimize2,
  X,
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
  { href: "/events", label: "Events", icon: PartyPopper },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

/** Compact footer controls in short landscape viewports */
const compactLandscape =
  "max-lg:landscape:min-h-0 max-lg:landscape:py-0 max-lg:landscape:h-8 max-lg:landscape:w-8";

function IconButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors",
        compactLandscape,
        disabled
          ? "cursor-not-allowed text-muted-foreground/35"
          : active
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function Sidebar({
  profile,
  onNavigate,
  className,
}: {
  profile: Profile;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    enabled,
    locked,
    immersive,
    index,
    count,
    toggleEnabled,
    toggleLocked,
    toggleImmersive,
    next,
  } = useBackground();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onNavigate?.();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "flex h-full max-h-dvh w-64 max-w-[85vw] flex-col border-r bg-card",
        className
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b p-5 max-lg:landscape:p-2 max-lg:landscape:py-1.5 md:p-6">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-primary max-lg:landscape:text-sm">
            Hotel & Spa CRM
          </h1>
          <p className="mt-1 text-xs text-muted-foreground max-lg:landscape:hidden">
            {ROLE_LABELS[profile.role]}
          </p>
        </div>
        {onNavigate ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onNavigate}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground max-lg:landscape:h-8 max-lg:landscape:w-8 lg:hidden"
          >
            <X className="h-5 w-5 max-lg:landscape:h-4 max-lg:landscape:w-4" />
          </button>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 max-lg:landscape:space-y-0.5 max-lg:landscape:p-1.5 md:p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors max-lg:landscape:min-h-8 max-lg:landscape:gap-2 max-lg:landscape:px-2 max-lg:landscape:py-1",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0 max-lg:landscape:h-4 max-lg:landscape:w-4" />
              {item.label}
            </Link>
          );
        })}
        {profile.role === "admin" && (
          <Link
            href="/settings"
            onClick={() => onNavigate?.()}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors max-lg:landscape:min-h-8 max-lg:landscape:gap-2 max-lg:landscape:px-2 max-lg:landscape:py-1",
              pathname.startsWith("/settings")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="h-5 w-5 shrink-0 max-lg:landscape:h-4 max-lg:landscape:w-4" />
            Settings
          </Link>
        )}
      </nav>

      <div className="shrink-0 border-t p-3 max-lg:landscape:p-1">
        <div className="flex items-center justify-between gap-0.5 px-1 max-lg:landscape:px-0">
          <IconButton
            label={enabled ? "Turn photos off" : "Turn photos on"}
            onClick={toggleEnabled}
            active={!enabled}
          >
            {enabled ? (
              <ImageIcon className="h-4 w-4" />
            ) : (
              <ImageOff className="h-4 w-4" />
            )}
          </IconButton>
          <IconButton
            label={locked ? "Unlock photo" : "Lock photo"}
            onClick={toggleLocked}
            disabled={!enabled}
            active={locked}
          >
            {locked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </IconButton>
          <IconButton
            label={`Next photo (${index + 1}/${count})`}
            onClick={next}
            disabled={!enabled}
          >
            <SkipForward className="h-4 w-4" />
          </IconButton>
          <IconButton
            label={
              immersive
                ? "Show tables and dashboards"
                : "Photo only (hide tables)"
            }
            onClick={toggleImmersive}
            disabled={!enabled && !immersive}
            active={immersive}
          >
            {immersive ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </IconButton>
        </div>
      </div>

      <div className="shrink-0 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-lg:landscape:flex max-lg:landscape:items-center max-lg:landscape:gap-2 max-lg:landscape:p-1.5 max-lg:landscape:pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        <div className="mb-3 min-w-0 px-3 max-lg:landscape:mb-0 max-lg:landscape:flex-1 max-lg:landscape:px-1">
          <p className="truncate text-sm font-medium max-lg:landscape:text-xs">
            {profile.full_name}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground max-lg:landscape:min-h-8 max-lg:landscape:w-auto max-lg:landscape:shrink-0 max-lg:landscape:gap-1.5 max-lg:landscape:px-2 max-lg:landscape:py-1 max-lg:landscape:text-xs"
        >
          <LogOut className="h-5 w-5 max-lg:landscape:h-4 max-lg:landscape:w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
