import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOwner } from "@/server/auth-guard";
import { adminRepository } from "@/server/db/repositories/admin.server";
import { AdminUsersView } from "@/features/admin/components/admin-users-view";

export const metadata: Metadata = { title: "Administração" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Quem não é o dono nem descobre que a página existe.
  const auth = await requireOwner();
  if (auth.response) notFound();

  const users = await adminRepository.listUsers();
  return <AdminUsersView initialUsers={users} />;
}
