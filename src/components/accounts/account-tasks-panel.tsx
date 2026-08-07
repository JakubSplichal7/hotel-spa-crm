"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/lib/types";

type TaskDoneFilter = "all" | "open" | "done";

export function AccountTasksPanel({ tasks }: { tasks: Task[] }) {
  const [filter, setFilter] = useState<TaskDoneFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "open") return tasks.filter((t) => t.status !== "done");
    if (filter === "done") return tasks.filter((t) => t.status === "done");
    return tasks;
  }, [tasks, filter]);

  if (!tasks.length) {
    return (
      <EmptyState
        title="No tasks"
        description="Create follow-up tasks for this client."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "all", label: "All" },
            { value: "open", label: "Not done" },
            { value: "done", label: "Done" },
          ] as const
        ).map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={filter === option.value ? "default" : "outline"}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
            <span className="ml-1.5 text-xs opacity-80">
              (
              {option.value === "all"
                ? tasks.length
                : option.value === "done"
                  ? tasks.filter((t) => t.status === "done").length
                  : tasks.filter((t) => t.status !== "done").length}
              )
            </span>
          </Button>
        ))}
      </div>

      {!filtered.length ? (
        <EmptyState
          title={filter === "done" ? "No done tasks" : "No open tasks"}
          description="Try another filter."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const isDone = task.status === "done";
            return (
              <Card key={task.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {task.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {(task.assignee as { full_name: string } | null)
                        ?.full_name || "Unassigned"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge variant={isDone ? "success" : "warning"}>
                      {isDone ? "Done" : "Not done"}
                    </Badge>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Due: {task.due_at ? formatDate(task.due_at) : "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
