import 'server-only'
import { timingSafeEqual } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { OWNER_USER_ID } from './db/schema'
import { EmailTakenError, normalizeEmail, usersRepository } from './db/repositories/users.server'
import type { GoogleIdentity } from './google-oauth'
import { getDummyHash, verifyPassword } from './passwords'

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me')
const COOKIE_NAME = 'orbit-session'

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) {
    // Evita short-circuit óbvio mantendo trabalho constante na comparação.
    timingSafeEqual(left, left)
    return false
  }
  return timingSafeEqual(left, right)
}

/** Grava o cookie de sessão. `sub` do JWT é o id do usuário (`owner` para o dono). */
export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  })
}

/** Id do usuário da sessão atual, ou `null` sem sessão válida. */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/** Email do dono, que entra pelas variáveis de ambiente e não pode ser cadastrado de novo. */
export function isOwnerEmail(email: string): boolean {
  const ownerEmail = process.env.AUTH_EMAIL ?? ''
  return Boolean(ownerEmail) && safeEqual(normalizeEmail(email), normalizeEmail(ownerEmail))
}

/** Credenciais do dono (env) com comparação timing-safe. */
function validateOwnerCredentials(email: string, password: string): boolean {
  const expectedPassword = process.env.AUTH_PASSWORD ?? ''
  if (!expectedPassword) return false
  return isOwnerEmail(email) && safeEqual(password, expectedPassword)
}

/** Confere email/senha do dono (env) e depois dos usuários cadastrados. Retorna o id do usuário. */
export async function authenticate(email: string, password: string): Promise<string | null> {
  if (validateOwnerCredentials(email, password)) return OWNER_USER_ID
  if (isOwnerEmail(email)) return null

  const user = await usersRepository.findByEmail(email)
  if (!user || !user.passwordHash) {
    await verifyPassword(password, await getDummyHash())
    return null
  }
  return (await verifyPassword(password, user.passwordHash)) ? user.id : null
}

export type GoogleSignInResult =
  | { userId: string; error?: undefined }
  | { userId?: undefined; error: 'signup_required' | 'account_conflict' | 'password_account' }

/**
 * Entra com uma identidade Google já validada (e-mail verificado pelo Google).
 * - E-mail do dono → dono.
 * - Conta já vinculada ao `sub` → essa conta.
 * - Conta com o mesmo e-mail e sem senha → vincula o Google a ela.
 * - Conta com o mesmo e-mail e com senha → recusa. O cadastro por senha não confirma o e-mail, então
 *   vincular abriria a conta de quem cadastrou o e-mail (talvez um atacante) para o dono real do Google.
 * - Senão cria a conta, se `allowCreate`.
 */
export async function signInWithGoogle(
  identity: GoogleIdentity,
  allowCreate: boolean
): Promise<GoogleSignInResult> {
  if (isOwnerEmail(identity.email)) return { userId: OWNER_USER_ID }

  const linked = await usersRepository.findByGoogleSub(identity.sub)
  if (linked) return { userId: linked.id }

  const byEmail = await usersRepository.findByEmail(identity.email)
  if (byEmail) {
    if (byEmail.googleSub && byEmail.googleSub !== identity.sub) return { error: 'account_conflict' }
    if (byEmail.passwordHash) return { error: 'password_account' }
    await usersRepository.linkGoogle(byEmail.id, identity.sub)
    return { userId: byEmail.id }
  }

  if (!allowCreate) return { error: 'signup_required' }
  try {
    return { userId: (await usersRepository.create(identity.email, '', identity.sub)).id }
  } catch (error) {
    if (error instanceof EmailTakenError) return { error: 'account_conflict' }
    throw error
  }
}
