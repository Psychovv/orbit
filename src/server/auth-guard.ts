import 'server-only'
import { NextResponse } from 'next/server'
import { verifySession } from './auth'

export async function requireAuth(): Promise<NextResponse | null> {
  const valid = await verifySession()
  if (!valid) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  return null
}
