"use client";

import { DeleteActivityButton } from "@/components/activities/delete-activity-button";
import {
  BulkRowCheckbox,
  BulkSelectAllCheckbox,
  BulkTableToolbar,
  bulkCheckboxCellClass,
  bulkCheckboxHeadClass,
  useBulkSelection,
} from "@/components/bulk-selection";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { getActivityTypeLabel, getAccountDisplayName } from "@/lib/types";
import { deleteActivities } from "@/lib/actions/activities";
import {
  CompactDateTime,
  dateColCellClass,
  dateColHeadClass,
} from "@/components/table-date";
import type { Activity } from "@/lib/types";
import Link from "next/link";

type ActivityRow = Activity & {
  account?: {
    id: string;
    name: string;
    nickname?: string | null;
  } | null;
  deal?: { id: string; title: string } | null;
  event?: { id: string; name: string } | null;
  creator?: { full_name: string } | null;
};

export function ActivitiesTable({
  activities,
}: {
  activities: ActivityRow[];
}) {
  const selection = useBulkSelection(activities.map((a) => a.id));

  return (
    <div>
      <BulkTableToolbar
        selection={selection}
        entityLabel="activity"
        onDelete={deleteActivities}
        exportFilename="activities"
        exportColumns={[
          "Type",
          "Subject",
          "Body",
          "Client",
          "Official name",
          "Offer",
          "Logged by",
          "When",
        ]}
        exportRows={activities.map((activity) => {
          const account = activity.account as {
            id: string;
            name: string;
            nickname?: string | null;
          } | null;
          const event = activity.event as {
            id: string;
            name: string;
          } | null;
          return {
            Type: getActivityTypeLabel(activity.type),
            Subject: activity.subject,
            Body: activity.body || "",
            Client: account
              ? getAccountDisplayName(account)
              : event
                ? `Event: ${event.name}`
                : "",
            "Official name": account?.name || "",
            Offer: activity.deal
              ? (activity.deal as { title: string }).title
              : "",
            "Logged by":
              (activity.creator as { full_name: string } | null)?.full_name ||
              "",
            When: formatDateTime(activity.occurred_at),
          };
        })}
      />
      <div className="overflow-x-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className={bulkCheckboxHeadClass}>
                <BulkSelectAllCheckbox selection={selection} />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Official name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Offer</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Logged by
              </th>
              <th className={dateColHeadClass}>When</th>
              <th className="w-12 px-2 py-3 text-right text-sm font-medium" />
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => {
              const account = activity.account as {
                id: string;
                name: string;
                nickname?: string | null;
              } | null;
              const event = activity.event as {
                id: string;
                name: string;
              } | null;

              return (
                <tr key={activity.id} className="border-b hover:bg-muted/30">
                  <td className={bulkCheckboxCellClass}>
                    <BulkRowCheckbox id={activity.id} selection={selection} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/activities/${activity.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {activity.subject}
                    </Link>
                    {activity.body && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                        {activity.body}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {account ? (
                      <Link
                        href={`/accounts/${account.id}`}
                        className="text-primary hover:underline"
                      >
                        {getAccountDisplayName(account)}
                      </Link>
                    ) : event ? (
                      <Link
                        href={`/events/${event.id}`}
                        className="text-primary hover:underline"
                      >
                        {event.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {account?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {activity.deal ? (
                      <Link
                        href={`/deals/${(activity.deal as { id: string }).id}`}
                        className="text-primary hover:underline"
                      >
                        {(activity.deal as { title: string }).title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(activity.creator as { full_name: string } | null)
                      ?.full_name || "—"}
                  </td>
                  <td className={dateColCellClass}>
                    <CompactDateTime value={activity.occurred_at} />
                  </td>
                  <td className="px-2 py-3 text-right">
                    <DeleteActivityButton
                      activityId={activity.id}
                      activitySubject={activity.subject}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
