import type { Metadata } from "next";
import { Suspense } from "react";
import { TasksView } from "@/features/tasks/components/tasks-view";
import { ViewSkeleton } from "@/shared/ui/view-skeleton";

export const metadata: Metadata = { title: "Tarefas" };

export default function TasksPage() {
  return (
    <Suspense fallback={<ViewSkeleton />}>
      <TasksView />
    </Suspense>
  );
}
