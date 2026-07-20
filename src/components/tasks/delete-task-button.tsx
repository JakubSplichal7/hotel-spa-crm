"use client";

import { deleteTask } from "@/lib/actions/tasks";
import { DeleteRowButton } from "@/components/delete-row-button";

export function DeleteTaskButton({
  taskId,
  taskTitle,
}: {
  taskId: string;
  taskTitle: string;
}) {
  return (
    <DeleteRowButton
      id={taskId}
      name={taskTitle}
      entityLabel="task"
      onDelete={deleteTask}
    />
  );
}
