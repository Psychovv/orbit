import type { Metadata } from "next";
import { HabitsView } from "@/features/habits/components/habits-view";
import { ViewSkeleton } from "@/shared/ui/view-skeleton";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Hábitos" };

export default function HabitsPage() {
  return (
    <Suspense fallback={<ViewSkeleton />}>
      <HabitsView />
    </Suspense>
  );
}
