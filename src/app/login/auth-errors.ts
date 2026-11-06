/** Mensagens para `?error=` nas telas de login e cadastro. */
const MESSAGES: Record<string, string> = {
  google_unavailable: 'Login com Google não está configurado.',
  google_cancelled: 'Login com Google cancelado.',
  google_failed: 'Não foi possível entrar com o Google. Tente de novo.',
  account_conflict: 'Este e-mail já está ligado a outra conta Google.',
  signup_required: 'Ainda não existe conta com esse Google. Crie uma com o código de convite.',
  invite: 'Código de convite inválido.',
  rate_limited: 'Muitas tentativas. Aguarde alguns minutos.',
}

export function authErrorMessage(code: string | string[] | undefined): string | undefined {
  return typeof code === 'string' ? MESSAGES[code] : undefined
}
