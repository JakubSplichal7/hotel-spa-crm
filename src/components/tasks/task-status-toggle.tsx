"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { CompleteTaskDialog } from "@/components/tasks/complete-task-dialog";

export function TaskStatusToggle({
  taskId,
  status,
  taskTitle,
}: {
  taskId: string;
  status: string;
  taskTitle?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  async function reopen() {
    setLoading(true);
    await updateTaskStatus(taskId, "open");
    setLoading(false);
    router.refresh();
  }

  if (status === "done") {
    return (
      <Button variant="outline" disabled={loading} onClick={reopen}>
        {loading ? "Updating..." : "Reopen task"}
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setCompleteOpen(true)}>
        Mark done
      </Button>
      <CompleteTaskDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        taskId={taskId}
        taskTitle={taskTitle}
      />
    </>
  );
}
