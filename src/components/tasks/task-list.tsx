"use client";

import { useRouter } from "next/navigation";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/lib/types";
import Link from "next/link";

export function TaskList({ tasks }: { tasks: Task[] }) {
  const router = useRouter();

  async function toggleTask(id: string, currentStatus: string) {
    await updateTaskStatus(id, currentStatus === "open" ? "done" : "open");
    router.refresh();
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">Task</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Offer</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Assignee</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Due</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isOverdue =
              task.status === "open" &&
              task.due_at &&
              new Date(task.due_at) < new Date();

            return (
              <tr
                key={task.id}
                className={`border-b hover:bg-muted/30 ${
                  task.status === "done" ? "opacity-60" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <p
                    className={`font-medium ${
                      task.status === "done" ? "line-through" : ""
                    }`}
                  >
                    {task.title}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm">
                  {task.account ? (
                    <Link
                      href={`/accounts/${(task.account as { id: string }).id}`}
                      className="text-primary hover:underline"
                    >
                      {(task.account as { name: string }).name}
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
                  {(task.assignee as { full_name: string } | undefined)?.full_name ||
                    "—"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {task.due_at ? formatDate(task.due_at) : "—"}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTask(task.id, task.status)}
                  >
                    {task.status === "done" ? "Undo" : "Done"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
