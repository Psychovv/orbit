import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth-guard";
import { taskCategoriesRepository } from "@/server/db/repositories/tasks.server";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const authResponse = await requireAuth();
  if (authResponse) return authResponse;

  const { id } = await ctx.params;
  await taskCategoriesRepository.remove(id);
  return new NextResponse(null, { status: 204 });
}
