import 'server-only'
import { timingSafeEqual } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me')
const COOKIE_NAME = 'orbit-session'
const MIN_PRODUCTION_PASSWORD_LENGTH = 16

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

export async function createSession() {
  const token = await new SignJWT({ sub: 'owner' })
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

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false
  try {
    await jwtVerify(token, SECRET)
    return true
  } catch {
    return false
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/** Valida email/senha do env. Em produção exige senha com pelo menos 16 caracteres. */
export function validateCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.AUTH_EMAIL ?? ''
  const expectedPassword = process.env.AUTH_PASSWORD ?? ''

  if (!expectedEmail || !expectedPassword) return false

  if (
    process.env.NODE_ENV === 'production' &&
    expectedPassword.length < MIN_PRODUCTION_PASSWORD_LENGTH
  ) {
    console.error(
      `[auth] AUTH_PASSWORD deve ter pelo menos ${MIN_PRODUCTION_PASSWORD_LENGTH} caracteres em produção.`
    )
    return false
  }

  return safeEqual(email, expectedEmail) && safeEqual(password, expectedPassword)
}
