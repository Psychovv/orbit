'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSession, validateCredentials } from '@/server/auth'
import {
  clientKeyFromHeaders,
  rateLimit,
  rateLimitRetryAfterMs,
  resetRateLimit,
} from '@/server/rate-limit'

const LOGIN_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export interface LoginState {
  error?: string
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

  if (!rateLimit(key, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
    const retryMs = rateLimitRetryAfterMs(key, LOGIN_LIMIT, LOGIN_WINDOW_MS) ?? LOGIN_WINDOW_MS
    const minutes = Math.max(1, Math.ceil(retryMs / 60_000))
    return {
      error: `Muitas tentativas. Aguarde cerca de ${minutes} min e tente de novo.`,
    }
  }

  if (!validateCredentials(email, password)) {
    return { error: 'Credenciais inválidas.' }
  }

  resetRateLimit(key)
  await createSession()
  redirect('/')
}
