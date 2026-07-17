import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineChart, ActivityChart, RevenueChart } from "@/components/reports/charts";
import { formatCurrency } from "@/lib/utils";
import { DEAL_STAGE_LABELS, ACTIVITY_TYPE_LABELS } from "@/lib/types";
import type { DealStage, ActivityType } from "@/lib/types";
import { PageHeader } from "@/components/page-header";

export default async function ReportsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { data: deals },
    { data: activities },
    { data: bookings },
    { data: wonDeals },
    { data: lostDeals },
  ] = await Promise.all([
    supabase.from("deals").select("stage, value").eq("org_id", profile.org_id),
    supabase.from("activities").select("type, created_by").eq("org_id", profile.org_id),
    supabase.from("bookings").select("value, currency, status").eq("org_id", profile.org_id),
    supabase
      .from("deals")
      .select("value, currency, updated_at")
      .eq("org_id", profile.org_id)
      .eq("stage", "won")
      .gte("updated_at", startOfMonth.toISOString()),
    supabase
      .from("deals")
      .select("id")
      .eq("org_id", profile.org_id)
      .eq("stage", "lost")
      .gte("updated_at", startOfMonth.toISOString()),
  ]);

  const pipelineData = (["lead", "qualified", "proposal", "negotiation", "won", "lost"] as DealStage[]).map(
    (stage) => ({
      stage: DEAL_STAGE_LABELS[stage],
      count: (deals || []).filter((d) => d.stage === stage).length,
      value: (deals || [])
        .filter((d) => d.stage === stage)
        .reduce((sum, d) => sum + Number(d.value), 0),
    })
  );

  const activityByType = (["call", "email", "meeting", "note"] as ActivityType[]).map((type) => ({
    type: ACTIVITY_TYPE_LABELS[type],
    count: (activities || []).filter((a) => a.type === type).length,
  }));

  const totalBookingsValue = (bookings || [])
    .filter((b) => b.status === "active")
    .reduce((sum, b) => sum + Number(b.value), 0);

  const wonThisMonth = (wonDeals || []).reduce((sum, d) => sum + Number(d.value), 0);
  const openPipelineValue = (deals || [])
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .reduce((sum, d) => sum + Number(d.value), 0);

  const monthlyRevenue = [
    { month: "Jan", value: 0 },
    { month: "Feb", value: 0 },
    { month: "Mar", value: 0 },
    { month: "Apr", value: 0 },
    { month: "May", value: 0 },
    { month: "Jun", value: wonThisMonth },
  ];

  const { data: repActivities } = await supabase
    .from("activities")
    .select("created_by, profiles!activities_created_by_fkey(full_name)")
    .eq("org_id", profile.org_id);

  const activitiesByRep = (repActivities || []).reduce(
    (acc, a) => {
      const profile = a.profiles as { full_name: string } | { full_name: string }[] | null;
      const name = Array.isArray(profile)
        ? profile[0]?.full_name
        : profile?.full_name;
      const key = name || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Pipeline, activity, and booking overview for your clients"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(openPipelineValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Won This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(wonThisMonth)}</div>
            <p className="text-xs text-muted-foreground">{wonDeals?.length || 0} deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lost This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lostDeals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">deals lost</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBookingsValue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineChart data={pipelineData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activities by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart data={activityByType} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={monthlyRevenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activities by Rep</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(activitiesByRep).length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity data yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(activitiesByRep)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm">{name}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
