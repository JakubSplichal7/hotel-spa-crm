import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateContactDialog } from "@/components/accounts/create-contact-dialog";
import { ContactsTable } from "@/components/accounts/contacts-table";
import { CreateAccountNoteDialog } from "@/components/accounts/create-account-note-dialog";
import { AccountNotesTable } from "@/components/accounts/account-notes-table";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { getDealStageLabel, getActivityTypeLabel, getAccountTypeLabel, getAcquisitionLabel } from "@/lib/types";
import Link from "next/link";
import { EditAccountDialog } from "@/components/accounts/edit-account-dialog";
import { TableExportBar } from "@/components/export-xlsx-button";
import type { Account, AccountNote, Profile } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("*, owner:profiles!accounts_owner_id_fkey(full_name)")
    .eq("id", id)
    .single();

  if (!account) notFound();

  const [
    { data: contacts },
    { data: notes },
    { data: deals },
    { data: activities },
    { data: tasks },
    { data: bookings },
    { data: profiles },
  ] = await Promise.all([
    supabase.from("contacts").select("*").eq("account_id", id).order("is_primary", { ascending: false }),
    supabase
      .from("account_notes")
      .select("*, creator:profiles!account_notes_created_by_fkey(full_name)")
      .eq("account_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("deals").select("*").eq("account_id", id).order("created_at", { ascending: false }),
    supabase.from("activities").select("*, creator:profiles!activities_created_by_fkey(full_name)").eq("account_id", id).order("occurred_at", { ascending: false }).limit(10),
    supabase.from("tasks").select("*, assignee:profiles!tasks_assignee_id_fkey(full_name)").eq("account_id", id).order("due_at"),
    supabase.from("bookings").select("*").eq("account_id", id).order("start_date", { ascending: false }),
    supabase.from("profiles").select("*").eq("org_id", profile.org_id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/accounts"
            className="text-sm font-semibold text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.8)] hover:text-primary"
          >
            &larr; Back to clients
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_12px_rgba(255,255,255,0.85),0_2px_8px_rgba(255,255,255,0.7)]">
            {account.nickname || account.name}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.8)]">
            Official name: {account.name}
          </p>
          {account.ico && (
            <p className="mt-1 text-sm font-semibold text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.8)]">
              IČO: {account.ico}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{getAccountTypeLabel(account.type)}</Badge>
            <Badge variant={account.status === "active" ? "success" : "warning"}>
              {account.status}
            </Badge>
            {account.is_vip && <Badge variant="warning">VIP</Badge>}
              {account.loyalty_tier && (
                <Badge variant="outline">
                  {getAcquisitionLabel(account.loyalty_tier)}
                </Badge>
              )}
            {(account.city || account.country) && (
              <span className="text-sm font-semibold text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.8)]">
                {[account.city, account.country].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.8)]">
            Account manager: {(account.owner as { full_name: string } | null)?.full_name}
          </p>
          {account.preferences && (
            <p className="mt-4 text-sm font-semibold text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.8)]">
              <span className="font-bold">Preferences:</span> {account.preferences}
            </p>
          )}
        </div>
        <EditAccountDialog
          account={account as Account}
          profiles={(profiles || []) as Profile[]}
        />
      </div>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">Contacts ({contacts?.length || 0})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes?.length || 0})</TabsTrigger>
          <TabsTrigger value="deals">Offers ({deals?.length || 0})</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="bookings">Bookings ({bookings?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-4">
          <div className="mb-4 flex justify-end">
            <CreateContactDialog accountId={id} />
          </div>
          {!contacts?.length ? (
            <EmptyState
              title="No contacts"
              description="Add people at this company, or guest details for an individual client."
            />
          ) : (
            <div>
              <TableExportBar
                filename={`contacts-${account.nickname || account.name}`}
                columns={["Name", "Title", "Email", "Phone", "Primary"]}
                rows={contacts.map((contact) => ({
                  Name: contact.name,
                  Title: contact.title || "",
                  Email: contact.email || "",
                  Phone: contact.phone || "",
                  Primary: contact.is_primary ? "Yes" : "No",
                }))}
              />
              <ContactsTable accountId={id} contacts={contacts || []} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="mb-4 flex justify-end">
            <CreateAccountNoteDialog accountId={id} />
          </div>
          {!notes?.length ? (
            <EmptyState
              title="No notes"
              description="Add internal notes the team should know about this client."
            />
          ) : (
            <div>
              <TableExportBar
                filename={`notes-${account.nickname || account.name}`}
                columns={["Title", "Note", "Created", "By"]}
                rows={(notes as AccountNote[]).map((note) => ({
                  Title: note.title || "",
                  Note: note.body,
                  Created: formatDateTime(note.created_at),
                  By:
                    (note.creator as { full_name: string } | null)?.full_name ||
                    "",
                }))}
              />
              <AccountNotesTable
                accountId={id}
                notes={(notes || []) as AccountNote[]}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="deals" className="mt-4">
          {!deals?.length ? (
            <EmptyState title="No offers" description="Create an offer or package from the Offers page." />
          ) : (
            <div className="space-y-2">
              {deals.map((deal) => (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <Card className="hover:bg-muted/30">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <Badge variant="secondary" className="mt-1">{getDealStageLabel(deal.stage)}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(Number(deal.value), deal.currency)}</p>
                        {deal.expected_close && (
                          <p className="text-sm text-muted-foreground">Close: {formatDate(deal.expected_close)}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          {!activities?.length ? (
            <EmptyState title="No activities" description="Log calls, emails, and meetings." />
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getActivityTypeLabel(activity.type)}</Badge>
                      <span className="font-medium">{activity.subject}</span>
                    </div>
                    {activity.body && <p className="mt-2 text-sm text-muted-foreground">{activity.body}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {(activity.creator as { full_name: string } | null)?.full_name} &middot;{" "}
                      {formatDateTime(activity.occurred_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          {!tasks?.length ? (
            <EmptyState title="No tasks" description="Create follow-up tasks for this client." />
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {(task.assignee as { full_name: string } | null)?.full_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={task.status === "done" ? "success" : "warning"}>{task.status}</Badge>
                      {task.due_at && (
                        <p className="mt-1 text-sm text-muted-foreground">{formatDate(task.due_at)}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          {!bookings?.length ? (
            <EmptyState title="No bookings" description="Record stays, spa visits, or event bookings for this client." />
          ) : (
            <div className="space-y-2">
              {bookings.map((booking) => (
                <Link key={booking.id} href={`/bookings/${booking.id}`}>
                  <Card className="hover:bg-muted/30">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{booking.title}</p>
                        <Badge variant="secondary" className="mt-1">{booking.status}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(Number(booking.value), booking.currency)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(booking.start_date)}
                          {booking.end_date && ` – ${formatDate(booking.end_date)}`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
