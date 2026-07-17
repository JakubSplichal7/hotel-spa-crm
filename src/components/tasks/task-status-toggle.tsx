"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";

export function TaskStatusToggle({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await updateTaskStatus(taskId, status === "open" ? "done" : "open");
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant="outline" disabled={loading} onClick={toggle}>
      {loading ? "Updating..." : status === "done" ? "Reopen task" : "Mark done"}
    </Button>
  );
}
