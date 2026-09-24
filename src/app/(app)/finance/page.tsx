import type { Metadata } from "next";
import { Suspense } from "react";
import { FinanceView } from "@/features/finance/components/finance-view";
import { ViewSkeleton } from "@/shared/ui/view-skeleton";

export const metadata: Metadata = { title: "Finanças" };

export default function FinancePage() {
  return (
    <Suspense fallback={<ViewSkeleton />}>
      <FinanceView />
    </Suspense>
  );
}
