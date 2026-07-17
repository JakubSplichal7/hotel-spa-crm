import { requireProfile } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { RotatingBackground } from "@/components/rotating-background";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="flex h-screen">
      <Sidebar profile={profile} />
      <main className="relative flex-1 overflow-y-auto">
        <RotatingBackground />
        <div className="relative z-10 container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
