import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateIdeaDialog } from "@/components/ideas/create-idea-dialog";
import { IdeasTable } from "@/components/ideas/ideas-table";
import { PageHeader } from "@/components/page-header";
import type { Idea } from "@/lib/types";

const titleShadow =
  "text-slate-950 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_12px_rgba(255,255,255,0.85),0_2px_8px_rgba(255,255,255,0.7)]";
const textShadow =
  "text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.8)]";

export default async function IdeasPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: ideas } = await supabase
    .from("ideas")
    .select("*, creator:profiles!ideas_created_by_fkey(full_name)")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false });

  const rows = (ideas || []) as Idea[];

  return (
    <div className="space-y-6">
      <PageHeader title="Ideas" description="Capture ideas with a name and description">
        <CreateIdeaDialog />
      </PageHeader>

      {!rows.length ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h3 className={`text-lg font-bold tracking-tight ${titleShadow}`}>
            No ideas yet
          </h3>
          <p className={`mt-2 max-w-sm text-sm font-semibold ${textShadow}`}>
            Add your first idea with a name and description.
          </p>
          <div className="mt-4">
            <CreateIdeaDialog />
          </div>
        </div>
      ) : (
        <IdeasTable rows={rows} />
      )}
    </div>
  );
}
