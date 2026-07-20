"use client";

import { DeleteIdeaButton } from "@/components/ideas/delete-idea-button";
import { EditIdeaDialog } from "@/components/ideas/edit-idea-dialog";
import {
  BulkRowCheckbox,
  BulkSelectAllCheckbox,
  BulkTableToolbar,
  bulkCheckboxCellClass,
  bulkCheckboxHeadClass,
  useBulkSelection,
} from "@/components/bulk-selection";
import { formatDate } from "@/lib/utils";
import { deleteIdeas } from "@/lib/actions/ideas";
import type { Idea } from "@/lib/types";

export function IdeasTable({ rows }: { rows: Idea[] }) {
  const selection = useBulkSelection(rows.map((r) => r.id));

  return (
    <div>
      <BulkTableToolbar
        selection={selection}
        entityLabel="idea"
        onDelete={deleteIdeas}
        showExport={false}
      />
      <div className="overflow-x-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className={`${bulkCheckboxHeadClass} p-3`}>
                <BulkSelectAllCheckbox selection={selection} />
              </th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Description</th>
              <th className="p-3 font-medium">Added</th>
              <th className="p-3 font-medium w-28" />
            </tr>
          </thead>
          <tbody>
            {rows.map((idea) => (
              <tr
                key={idea.id}
                className="border-b last:border-0 hover:bg-muted/20"
              >
                <td className={`${bulkCheckboxCellClass} p-3`}>
                  <BulkRowCheckbox id={idea.id} selection={selection} />
                </td>
                <td className="p-3 font-medium">{idea.name}</td>
                <td className="max-w-md p-3 text-muted-foreground">
                  <p className="line-clamp-3">{idea.note || "—"}</p>
                </td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(idea.created_at)}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <EditIdeaDialog idea={idea} />
                    <DeleteIdeaButton
                      ideaId={idea.id}
                      ideaName={idea.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
