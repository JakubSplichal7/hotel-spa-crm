"use client";

import { EditContactDialog } from "@/components/accounts/edit-contact-dialog";
import { DeleteRowButton } from "@/components/delete-row-button";
import { Badge } from "@/components/ui/badge";
import { deleteContact } from "@/lib/actions/accounts";
import type { Contact } from "@/lib/types";

export function ContactsTable({
  accountId,
  contacts,
}: {
  accountId: string;
  contacts: Contact[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
            <th className="w-12 px-2 py-3 text-right text-sm font-medium" />
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">
                {contact.name}
                {contact.is_primary && (
                  <Badge className="ml-2" variant="default">
                    Primary
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 text-sm">{contact.title || "—"}</td>
              <td className="px-4 py-3 text-sm">{contact.email || "—"}</td>
              <td className="px-4 py-3 text-sm">{contact.phone || "—"}</td>
              <td className="px-2 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <EditContactDialog
                    contact={contact}
                    accountId={accountId}
                    compact
                  />
                  <DeleteRowButton
                    id={contact.id}
                    name={contact.name}
                    entityLabel="contact"
                    onDelete={(contactId) =>
                      deleteContact(contactId, accountId)
                    }
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
