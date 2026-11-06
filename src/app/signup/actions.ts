'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSession, isOwnerEmail } from '@/server/auth'
import { EmailTakenError, usersRepository } from '@/server/db/repositories/users.server'
import { hashPassword } from '@/server/passwords'
import { clientKeyFromHeaders, rateLimit } from '@/server/rate-limit'
import { inviteCodeMatches } from '@/server/signup-policy'

const SIGNUP_LIMIT = 5
const SIGNUP_WINDOW_MS = 60 * 60 * 1000

export interface SignupState {
  error?: string
}

const SignupSchema = z
  .object({
    email: z.email('E-mail inválido.').max(254),
    password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.').max(128, 'Senha longa demais.'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'As senhas não conferem.' })

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE !== 'http') {
    return { error: 'Cadastro disponível só no modo nuvem.' }
  }

  const headerStore = await headers()
  if (!(await rateLimit(`signup:${clientKeyFromHeaders(headerStore)}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS))) {
    return { error: 'Muitas contas criadas daqui. Tente de novo mais tarde.' }
  }

  if (!inviteCodeMatches(String(formData.get('invite') ?? ''))) {
    return { error: 'Código de convite inválido.' }
  }

  const parsed = SignupSchema.safeParse({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    confirm: String(formData.get('confirm') ?? ''),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { email, password } = parsed.data
  if (isOwnerEmail(email)) {
    return { error: 'E-mail já cadastrado.' }
  }

  let userId: string
  try {
    userId = (await usersRepository.create(email, await hashPassword(password))).id
  } catch (error) {
    if (error instanceof EmailTakenError) return { error: error.message }
    console.error('[signup] create failed', error instanceof Error ? error.name : 'unknown')
    return { error: 'Não foi possível criar a conta agora.' }
  }

  await createSession(userId)
  redirect('/')
}
