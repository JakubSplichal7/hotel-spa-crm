"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompleteTaskDialog } from "@/components/tasks/complete-task-dialog";
import { DeleteTaskButton } from "@/components/tasks/delete-task-button";
import { formatDate } from "@/lib/utils";
import {
  formatCompletionDelta,
  getTaskDayDelta,
} from "@/lib/task-dates";
import type { Task } from "@/lib/types";
import { getAccountDisplayName } from "@/lib/types";
import { TableExportBar } from "@/components/export-xlsx-button";
import {
  CompactDate,
  dateColCellClass,
  dateColHeadClass,
} from "@/components/table-date";
import Link from "next/link";

function isDueBeforeToday(dueAt: string | null | undefined) {
  if (!dueAt) return false;
  const due = dueAt.slice(0, 10);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return due < today;
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [completeTask, setCompleteTask] = useState<Task | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function reopenTask(id: string) {
    setLoadingId(id);
    await updateTaskStatus(id, "open");
    setLoadingId(null);
    router.refresh();
  }

  return (
    <>
      <TableExportBar
        filename={
          tasks[0]?.status === "done" ? "tasks-completed" : "tasks-open"
        }
        columns={[
          "Task",
          "Client",
          "Offer",
          "Assignee",
          "Due",
          "Done on",
          "Delta days",
          "Status",
        ]}
        rows={tasks.map((task) => {
          const isOverdue =
            task.status === "open" && isDueBeforeToday(task.due_at);
          const delta = getTaskDayDelta(task);
          return {
            Task: task.title,
            Client: task.account
              ? getAccountDisplayName(
                  task.account as { name?: string; nickname?: string }
                )
              : "",
            Offer: task.deal ? (task.deal as { title: string }).title : "",
            Assignee:
              (task.assignee as { full_name: string } | undefined)?.full_name ||
              "",
            Due: task.due_at ? formatDate(task.due_at) : "",
            "Done on": task.completed_at ? formatDate(task.completed_at) : "",
            "Delta days":
              delta === null ? "" : formatCompletionDelta(delta.days),
            Status: isOverdue ? "overdue" : task.status,
          };
        })}
      />
      <div className="overflow-x-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Task</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Offer</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Assignee</th>
              <th className={dateColHeadClass}>Due</th>
              <th className={dateColHeadClass}>Done</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Δ days</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
              <th className="w-12 px-2 py-3 text-right text-sm font-medium" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const isOverdue =
                task.status === "open" && isDueBeforeToday(task.due_at);
              const delta = getTaskDayDelta(task);

              return (
                <tr
                  key={task.id}
                  className={`border-b hover:bg-muted/30 ${
                    task.status === "done" ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/tasks/${task.id}`}
                      className={`font-medium text-primary hover:underline ${
                        task.status === "done" ? "line-through" : ""
                      }`}
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {task.account ? (
                      <Link
                        href={`/accounts/${(task.account as { id: string }).id}`}
                        className="text-primary hover:underline"
                      >
                        {getAccountDisplayName(
                          task.account as { name?: string; nickname?: string }
                        )}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {task.deal ? (
                      <Link
                        href={`/deals/${(task.deal as { id: string }).id}`}
                        className="text-primary hover:underline"
                      >
                        {(task.deal as { title: string }).title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(task.assignee as { full_name: string } | undefined)
                      ?.full_name || "—"}
                  </td>
                  <td className={dateColCellClass}>
                    <CompactDate value={task.due_at} />
                  </td>
                  <td className={dateColCellClass}>
                    <CompactDate value={task.completed_at} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {delta === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={
                          delta.late
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }
                      >
                        {formatCompletionDelta(delta.days)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        task.status === "done"
                          ? "success"
                          : isOverdue
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {isOverdue ? "overdue" : task.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {task.status === "done" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingId === task.id}
                        onClick={() => reopenTask(task.id)}
                      >
                        Undo
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompleteTask(task)}
                      >
                        Done
                      </Button>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <DeleteTaskButton
                      taskId={task.id}
                      taskTitle={task.title}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {completeTask && (
        <CompleteTaskDialog
          open={!!completeTask}
          onOpenChange={(open) => !open && setCompleteTask(null)}
          taskId={completeTask.id}
          taskTitle={completeTask.title}
        />
      )}
    </>
  );
}
