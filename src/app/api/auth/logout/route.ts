import { NextResponse } from 'next/server'
import { deleteSession } from '@/server/auth'

export async function POST() {
  await deleteSession()
  return NextResponse.json({ ok: true })
}
