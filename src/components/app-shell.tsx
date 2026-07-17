"use client";

import { BackgroundProvider } from "@/components/background-provider";
import { Sidebar } from "@/components/sidebar";
import { RotatingBackground } from "@/components/rotating-background";
import type { Profile } from "@/lib/types";

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <BackgroundProvider>
      <div className="flex h-screen">
        <Sidebar profile={profile} />
        <main className="relative flex-1 overflow-y-auto">
          <RotatingBackground />
          <div className="relative z-10 container mx-auto p-6">{children}</div>
        </main>
      </div>
    </BackgroundProvider>
  );
}
