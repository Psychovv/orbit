'use server'

import { redirect } from 'next/navigation'
import { createSession, validateCredentials } from '@/server/auth'

export interface LoginState {
  error?: string
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Preencha todos os campos.' }
  }
  
  if (!validateCredentials(email, password)) {
    return { error: 'Credenciais inválidas.' }
  }
  
  await createSession()
  redirect('/')
}
