import 'server-only'
import { NextResponse } from 'next/server'
import { verifySession } from './auth'

/** Auth só é obrigatória no modo http. Em local, APIs de IA etc. ficam abertas. */
const AUTH_REQUIRED = process.env.NEXT_PUBLIC_DATA_SOURCE === 'http'

export async function requireAuth(): Promise<NextResponse | null> {
  if (!AUTH_REQUIRED) return null

  const valid = await verifySession()
  if (!valid) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  return null
}
