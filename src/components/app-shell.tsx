"use client";

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

  return (
    <div className="flex h-screen">
      <Sidebar profile={profile} />
      <main className="relative flex-1 overflow-y-auto">
        <RotatingBackground />
        <div
          className={cn(
            "relative z-10 container mx-auto p-6 transition-opacity duration-300",
            immersive && "pointer-events-none invisible opacity-0"
          )}
          aria-hidden={immersive}
        >
          {children}
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
