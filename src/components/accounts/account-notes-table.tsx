"use client";

import { EditAccountNoteDialog } from "@/components/accounts/edit-account-note-dialog";
import { DeleteRowButton } from "@/components/delete-row-button";
import { deleteAccountNote } from "@/lib/actions/accounts";
import { formatDateTime } from "@/lib/utils";
import type { AccountNote } from "@/lib/types";

export function AccountNotesTable({
  accountId,
  notes,
}: {
  accountId: string;
  notes: AccountNote[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Note</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
            <th className="px-4 py-3 text-left text-sm font-medium">By</th>
            <th className="w-12 px-2 py-3 text-right text-sm font-medium" />
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <tr key={note.id} className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{note.title || "—"}</td>
              <td className="max-w-md px-4 py-3 text-sm whitespace-pre-wrap">
                {note.body}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDateTime(note.created_at)}
              </td>
              <td className="px-4 py-3 text-sm">
                {(note.creator as { full_name: string } | null)?.full_name ||
                  "—"}
              </td>
              <td className="px-2 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <EditAccountNoteDialog
                    note={note}
                    accountId={accountId}
                    compact
                  />
                  <DeleteRowButton
                    id={note.id}
                    name={note.title || note.body.slice(0, 40)}
                    entityLabel="note"
                    onDelete={(noteId) => deleteAccountNote(noteId, accountId)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
