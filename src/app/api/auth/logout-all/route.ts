import { NextResponse } from 'next/server'
import { revokeAllSessions } from '@/server/auth'
import { requireUser } from '@/server/auth-guard'

/** Encerra a sessão em todos os dispositivos. */
export async function POST() {
  const auth = await requireUser()
  if (auth.response) return auth.response
  await revokeAllSessions(auth.userId)
  return NextResponse.json({ ok: true })
}
