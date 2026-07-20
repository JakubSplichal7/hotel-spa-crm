import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateIdeaDialog } from "@/components/ideas/create-idea-dialog";
import { EditIdeaDialog } from "@/components/ideas/edit-idea-dialog";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/utils";
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
      <PageHeader
        title="Ideas"
        description="Capture idea names, notes, and contacts"
      >
        <CreateIdeaDialog />
      </PageHeader>

      {!rows.length ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h3 className={`text-lg font-bold tracking-tight ${titleShadow}`}>
            No ideas yet
          </h3>
          <p className={`mt-2 max-w-sm text-sm font-semibold ${textShadow}`}>
            Add your first idea with a name, note, and contact.
          </p>
          <div className="mt-4">
            <CreateIdeaDialog />
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Note</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">Added</th>
                <th className="p-3 font-medium w-24" />
              </tr>
            </thead>
            <tbody>
              {rows.map((idea) => (
                <tr
                  key={idea.id}
                  className="border-b last:border-0 hover:bg-muted/20"
                >
                  <td className="p-3 font-medium">{idea.name}</td>
                  <td className="max-w-xs p-3 text-muted-foreground">
                    <p className="line-clamp-2">{idea.note || "—"}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {idea.contact || "—"}
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(idea.created_at)}
                  </td>
                  <td className="p-3">
                    <EditIdeaDialog idea={idea} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
