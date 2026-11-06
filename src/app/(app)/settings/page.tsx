import type { Metadata } from "next";
import { SettingsView } from "@/features/settings/components/settings-view";
import { requireOwner } from "@/server/auth-guard";

export const metadata: Metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const isAdmin = !(await requireOwner()).response;
  return <SettingsView isAdmin={isAdmin} />;
}
