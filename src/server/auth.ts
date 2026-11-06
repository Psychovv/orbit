import 'server-only'
import { timingSafeEqual } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { OWNER_USER_ID } from './db/schema'
import { normalizeEmail, usersRepository } from './db/repositories/users.server'
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
  if (!user) {
    await verifyPassword(password, await getDummyHash())
    return null
  }
  return (await verifyPassword(password, user.passwordHash)) ? user.id : null
}
