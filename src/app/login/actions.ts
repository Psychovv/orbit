'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { authenticate, createSession } from '@/server/auth'
import {
  clientKeyFromHeaders,
  rateLimit,
  rateLimitRetryAfterMs,
  resetRateLimit,
} from '@/server/rate-limit'

const LOGIN_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000
/** Teto por e-mail, somando todos os IPs: segura força bruta distribuída contra uma conta. */
const LOGIN_EMAIL_LIMIT = 20

export interface LoginState {
  error?: string
}

function emailKey(email: string): string {
  return `login-email:${email.trim().toLowerCase()}`
}

function loginKey(ip: string, email: string): string {
  return `login:${ip}:${email.trim().toLowerCase()}`
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Preencha todos os campos.' }
  }

  const headerStore = await headers()
  const ip = clientKeyFromHeaders(headerStore)
  const key = loginKey(ip, email)

  const perEmailKey = emailKey(email)
  const allowedByIp = await rateLimit(key, LOGIN_LIMIT, LOGIN_WINDOW_MS)
  const allowedByEmail = await rateLimit(perEmailKey, LOGIN_EMAIL_LIMIT, LOGIN_WINDOW_MS)
  if (!allowedByIp || !allowedByEmail) {
    const retryMs =
      Math.max(
        (await rateLimitRetryAfterMs(key, LOGIN_LIMIT, LOGIN_WINDOW_MS)) ?? 0,
        (await rateLimitRetryAfterMs(perEmailKey, LOGIN_EMAIL_LIMIT, LOGIN_WINDOW_MS)) ?? 0
      ) || LOGIN_WINDOW_MS
    const minutes = Math.max(1, Math.ceil(retryMs / 60_000))
    return {
      error: `Muitas tentativas. Aguarde cerca de ${minutes} min e tente de novo.`,
    }
  }

  const userId = await authenticate(email, password)
  if (!userId) {
    return { error: 'Credenciais inválidas.' }
  }

  await resetRateLimit(key)
  await resetRateLimit(perEmailKey)
  await createSession(userId)
  redirect('/')
}
