"use client";

import { updateTaskStatus } from "@/lib/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/lib/types";
import Link from "next/link";

export function TaskList({ tasks }: { tasks: Task[] }) {
  async function toggleTask(id: string, currentStatus: string) {
    await updateTaskStatus(id, currentStatus === "open" ? "done" : "open");
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const isOverdue =
          task.status === "open" && task.due_at && new Date(task.due_at) < new Date();

        return (
          <Card key={task.id} className={task.status === "done" ? "opacity-60" : ""}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleTask(task.id, task.status)}
                >
                  {task.status === "done" ? "Undo" : "Done"}
                </Button>
                <div>
                  <p className={`font-medium ${task.status === "done" ? "line-through" : ""}`}>
                    {task.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(task.assignee as { full_name: string } | undefined)?.full_name}
                    {task.account && (
                      <>
                        {" "}&middot;{" "}
                        <Link
                          href={`/accounts/${(task.account as { id: string }).id}`}
                          className="text-primary hover:underline"
                        >
                          {(task.account as { name: string }).name}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={task.status === "done" ? "success" : isOverdue ? "destructive" : "warning"}>
                  {isOverdue ? "overdue" : task.status}
                </Badge>
                {task.due_at && (
                  <p className="mt-1 text-sm text-muted-foreground">{formatDate(task.due_at)}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
