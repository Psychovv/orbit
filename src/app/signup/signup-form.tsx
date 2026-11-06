'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signupAction, type SignupState } from './actions'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { OrbitMark } from '@/shared/ui/orbit-mark'

const initialState: SignupState = {}
const inputClass = 'w-full bg-[#151324] border-[#231f38]'

export function SignupForm({ requiresInvite }: { requiresInvite: boolean }) {
  const [state, formAction, isPending] = useActionState(signupAction, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090812] text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#100e1e] border border-[#231f38] shadow-2xl">
        <div className="flex justify-center mb-8">
          <OrbitMark className="w-16 h-16 text-[#844DFE]" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Criar conta no Orbit</h1>
          <p className="text-[#9a94b0]">Seus dados ficam separados dos outros usuários</p>
        </div>

        <form action={formAction} className="space-y-4">
          <Input name="email" type="email" placeholder="Email" autoComplete="email" required className={inputClass} />
          <Input
            name="password"
            type="password"
            placeholder="Senha (mín. 8 caracteres)"
            autoComplete="new-password"
            minLength={8}
            required
            className={inputClass}
          />
          <Input
            name="confirm"
            type="password"
            placeholder="Confirme a senha"
            autoComplete="new-password"
            minLength={8}
            required
            className={inputClass}
          />
          {requiresInvite && (
            <Input name="invite" type="text" placeholder="Código de convite" required className={inputClass} />
          )}

          {state.error && <p className="text-sm text-[#f43f5e] text-center mt-2">{state.error}</p>}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#844DFE] hover:bg-[#723ce6] text-white"
          >
            {isPending ? 'Criando...' : 'Criar conta'}
          </Button>
        </form>

        <p className="text-sm text-[#9a94b0] text-center mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-[#844DFE] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
