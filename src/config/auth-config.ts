/** Configuração de autenticação compartilhada por proxy, auth e rotas. Sem `server-only`: o proxy também usa. */

const DEV_SECRET = 'dev-secret-change-me'
const MIN_SECRET_BYTES = 32

let cachedSecret: Uint8Array | null = null

/**
 * Chave de assinatura dos JWTs. Em produção, exige AUTH_SECRET com pelo menos 32 bytes
 * (lança erro, sem valor padrão). Fora de produção, cai num valor de desenvolvimento.
 * Lida de forma preguiçosa para não quebrar o `next build` sem variáveis.
 */
export function getAuthSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret
  const value = process.env.AUTH_SECRET
  if (process.env.NODE_ENV === 'production') {
    if (!value || new TextEncoder().encode(value).length < MIN_SECRET_BYTES) {
      throw new Error(`AUTH_SECRET ausente ou com menos de ${MIN_SECRET_BYTES} bytes em produção.`)
    }
  }
  cachedSecret = new TextEncoder().encode(value || DEV_SECRET)
  return cachedSecret
}

/** Em produção a autenticação é sempre exigida; fora dela, só no modo http. */
export function isAuthRequired(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DATA_SOURCE === 'http'
}

/** Audiência dos JWTs de sessão: outros tokens assinados com o mesmo segredo (ex.: state do Google) não valem como sessão. */
export const SESSION_AUDIENCE = 'orbit-session'
