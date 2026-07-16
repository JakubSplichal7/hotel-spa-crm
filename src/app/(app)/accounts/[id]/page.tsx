import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateContactDialog } from "@/components/accounts/create-contact-dialog";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { DEAL_STAGE_LABELS, ACTIVITY_TYPE_LABELS } from "@/lib/types";
import Link from "next/link";
import { deleteContact } from "@/lib/actions/accounts";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: PageProps) {
  await requireProfile();
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
    { data: deals },
    { data: activities },
    { data: tasks },
    { data: bookings },
  ] = await Promise.all([
    supabase.from("contacts").select("*").eq("account_id", id).order("is_primary", { ascending: false }),
    supabase.from("deals").select("*").eq("account_id", id).order("created_at", { ascending: false }),
    supabase.from("activities").select("*, creator:profiles!activities_created_by_fkey(full_name)").eq("account_id", id).order("occurred_at", { ascending: false }).limit(10),
    supabase.from("tasks").select("*, assignee:profiles!tasks_assignee_id_fkey(full_name)").eq("account_id", id).order("due_at"),
    supabase.from("bookings").select("*").eq("account_id", id).order("start_date", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/accounts" className="text-sm text-muted-foreground hover:text-primary">
          &larr; Back to accounts
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{account.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary">{account.type}</Badge>
              <Badge variant={account.status === "active" ? "success" : "warning"}>
                {account.status}
              </Badge>
              {(account.city || account.country) && (
                <span className="text-sm text-muted-foreground">
                  {[account.city, account.country].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Owner: {(account.owner as { full_name: string } | null)?.full_name}
            </p>
          </div>
        </div>
        {account.notes && (
          <p className="mt-4 text-sm text-muted-foreground">{account.notes}</p>
        )}
      </div>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">Contacts ({contacts?.length || 0})</TabsTrigger>
          <TabsTrigger value="deals">Deals ({deals?.length || 0})</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="bookings">Bookings ({bookings?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-4">
          <div className="mb-4 flex justify-end">
            <CreateContactDialog accountId={id} />
          </div>
          {!contacts?.length ? (
            <EmptyState title="No contacts" description="Add decision-makers at this property." />
          ) : (
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-b">
                      <td className="px-4 py-3 font-medium">
                        {contact.name}
                        {contact.is_primary && (
                          <Badge className="ml-2" variant="default">Primary</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{contact.title || "—"}</td>
                      <td className="px-4 py-3 text-sm">{contact.email || "—"}</td>
                      <td className="px-4 py-3 text-sm">{contact.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <form action={async () => { "use server"; await deleteContact(contact.id, id); }}>
                          <Button type="submit" variant="ghost" size="sm">Remove</Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="deals" className="mt-4">
          {!deals?.length ? (
            <EmptyState title="No deals" description="Create a deal from the Deals page." />
          ) : (
            <div className="space-y-2">
              {deals.map((deal) => (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <Card className="hover:bg-muted/30">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <Badge variant="secondary" className="mt-1">{DEAL_STAGE_LABELS[deal.stage]}</Badge>
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
                      <Badge variant="outline">{ACTIVITY_TYPE_LABELS[activity.type]}</Badge>
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
            <EmptyState title="No tasks" description="Create follow-up tasks for this account." />
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
            <EmptyState title="No bookings" description="Record contracts and bookings for this account." />
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
