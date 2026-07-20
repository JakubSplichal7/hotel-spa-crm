"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { BackgroundProvider, useBackground } from "@/components/background-provider";
import { Sidebar } from "@/components/sidebar";
import { RotatingBackground } from "@/components/rotating-background";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

function AppShellInner({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const { immersive } = useBackground();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex h-dvh min-h-0">
      {/* Desktop sidebar */}
      <div className="hidden h-full shrink-0 md:flex">
        <Sidebar profile={profile} />
      </div>

      {/* Mobile drawer */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex shadow-xl">
            <Sidebar
              profile={profile}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Stays fixed in the main pane while content scrolls */}
        <RotatingBackground />

        <div
          className={cn(
            "relative z-30 flex shrink-0 items-center gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden",
            immersive && "bg-black/40 text-white"
          )}
        >
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-md",
              immersive
                ? "bg-white/15 text-white"
                : "bg-muted text-foreground hover:bg-accent"
            )}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-bold",
                immersive ? "text-white" : "text-primary"
              )}
            >
              Hotel & Spa CRM
            </p>
          </div>
        </div>

        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div
            className={cn(
              "container mx-auto w-full max-w-full px-4 py-4 transition-opacity duration-300 sm:px-6 md:py-6",
              immersive && "pointer-events-none invisible opacity-0"
            )}
            aria-hidden={immersive}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <BackgroundProvider>
      <AppShellInner profile={profile}>{children}</AppShellInner>
    </BackgroundProvider>
  );
}
