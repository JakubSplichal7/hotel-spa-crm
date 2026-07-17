import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { getDealStageLabel, getActivityTypeLabel } from "@/lib/types";
import { Handshake, CheckSquare, Activity, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [
    { data: deals },
    { data: tasksDueToday },
    { data: overdueTasks },
    { data: recentActivities },
    { data: expiringBookings },
  ] = await Promise.all([
    supabase
      .from("deals")
      .select("id, title, stage, value, currency")
      .eq("org_id", profile.org_id)
      .not("stage", "in", '("won","lost")'),
    supabase
      .from("tasks")
      .select("id, title, due_at, status")
      .eq("org_id", profile.org_id)
      .eq("assignee_id", profile.id)
      .eq("status", "open")
      .eq("due_at", todayStr),
    supabase
      .from("tasks")
      .select("id, title, due_at")
      .eq("org_id", profile.org_id)
      .eq("assignee_id", profile.id)
      .eq("status", "open")
      .lt("due_at", todayStr),
    supabase
      .from("activities")
      .select("id, type, subject, occurred_at, account:accounts(name)")
      .eq("org_id", profile.org_id)
      .order("occurred_at", { ascending: false })
      .limit(5),
    supabase
      .from("bookings")
      .select("id, title, end_date, account:accounts(name)")
      .eq("org_id", profile.org_id)
      .eq("status", "active")
      .lte("end_date", thirtyDaysFromNow.toISOString().split("T")[0])
      .order("end_date", { ascending: true })
      .limit(5),
  ]);

  const dealsByStage = (deals || []).reduce(
    (acc, deal) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalPipelineValue = (deals || []).reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${profile.full_name} — your client overview`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Offers</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalPipelineValue)} pipeline
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasks Due Today</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksDueToday?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(overdueTasks?.length || 0) > 0 && (
                <span className="text-destructive">{overdueTasks?.length} overdue</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentActivities?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Last 5 logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring Bookings</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringBookings?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(dealsByStage).length === 0 ? (
              <p className="text-sm text-muted-foreground">No open deals</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(dealsByStage).map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between">
                    <Badge variant="secondary">{getDealStageLabel(stage)}</Badge>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            {!tasksDueToday?.length ? (
              <p className="text-sm text-muted-foreground">No tasks due today</p>
            ) : (
              <ul className="space-y-2">
                {tasksDueToday.map((task) => (
                  <li key={task.id} className="flex items-center justify-between text-sm">
                    <span>{task.title}</span>
                    <span className="text-muted-foreground">{formatDate(task.due_at!)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentActivities?.length ? (
              <p className="text-sm text-muted-foreground">No activities yet</p>
            ) : (
              <ul className="space-y-3">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getActivityTypeLabel(activity.type)}</Badge>
                      <span className="font-medium">{activity.subject}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {(activity.account as { name: string } | null)?.name} &middot;{" "}
                      {formatDateTime(activity.occurred_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expiring Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {!expiringBookings?.length ? (
              <p className="text-sm text-muted-foreground">No bookings expiring soon</p>
            ) : (
              <ul className="space-y-2">
                {expiringBookings.map((booking) => (
                  <li key={booking.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{booking.title}</span>
                      <p className="text-muted-foreground">
                        {(booking.account as { name: string } | null)?.name}
                      </p>
                    </div>
                    <span className="text-muted-foreground">{formatDate(booking.end_date!)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
