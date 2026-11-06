import 'server-only'
import { NextResponse } from 'next/server'
import { getSessionUserId } from './auth'
import { OWNER_USER_ID } from './db/schema'

/** Auth só é obrigatória no modo http. Em local, APIs de IA etc. ficam abertas. */
const AUTH_REQUIRED = process.env.NEXT_PUBLIC_DATA_SOURCE === 'http'

export type AuthResult =
  | { userId: string; response?: undefined }
  | { userId?: undefined; response: NextResponse }

/**
 * Usuário da requisição. Sem sessão no modo http, devolve a resposta 401 para a rota retornar.
 * No modo local não há login: tudo é do dono.
 */
export async function requireUser(): Promise<AuthResult> {
  if (!AUTH_REQUIRED) return { userId: OWNER_USER_ID }

  const userId = await getSessionUserId()
  if (!userId) {
    return { response: NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }) }
  }
  return { userId }
}

/** Para rotas que só precisam de alguém logado, sem dados por usuário. */
export async function requireAuth(): Promise<NextResponse | null> {
  return (await requireUser()).response ?? null
}
