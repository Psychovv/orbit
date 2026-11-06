import 'server-only'
import { NextResponse } from 'next/server'
import { getSessionUserId } from './auth'
import { isAuthRequired } from '@/config/auth-config'
import { OWNER_USER_ID } from './db/schema'

export type AuthResult =
  | { userId: string; response?: undefined }
  | { userId?: undefined; response: NextResponse }

/**
 * Usuário da requisição. Sem sessão no modo http, devolve a resposta 401 para a rota retornar.
 * No modo local não há login: tudo é do dono.
 */
export async function requireUser(): Promise<AuthResult> {
  if (!isAuthRequired()) return { userId: OWNER_USER_ID }

  const userId = await getSessionUserId()
  if (!userId) {
    return { response: NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }) }
  }
  return { userId }
}
