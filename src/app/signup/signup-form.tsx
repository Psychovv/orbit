'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { signupAction, type SignupState } from './actions'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { OrbitMark } from '@/shared/ui/orbit-mark'
import { GoogleButton, OrDivider } from '@/app/login/google-button'

const initialState: SignupState = {}
const inputClass = 'w-full bg-[#151324] border-[#231f38]'

export function SignupForm({ requiresInvite, googleEnabled, error }: {
  requiresInvite: boolean
  googleEnabled: boolean
  error?: string
}) {
  const [state, formAction, isPending] = useActionState(signupAction, initialState)
  const [invite, setInvite] = useState('')
  const [inviteMissing, setInviteMissing] = useState(false)
  const googleHref = '/api/auth/google?mode=signup'
  const message = (inviteMissing ? 'Digite o código de convite antes.' : undefined) ?? state.error ?? error

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

        {requiresInvite && (
          <Input
            name="invite"
            form="signup-form"
            type="text"
            placeholder="Código de convite"
            autoComplete="off"
            required
            value={invite}
            onChange={(e) => {
              setInvite(e.target.value)
              setInviteMissing(false)
            }}
            className={`${inputClass} mb-4`}
          />
        )}

        {googleEnabled && (
          <div className="space-y-4 mb-4">
            <GoogleButton
              href={googleHref}
              onNavigate={
                requiresInvite
                  ? () => {
                      if (!invite.trim()) {
                        setInviteMissing(true)
                        return null
                      }
                      return `${googleHref}&invite=${encodeURIComponent(invite.trim())}`
                    }
                  : undefined
              }
            />
            <OrDivider />
          </div>
        )}

        <form id="signup-form" action={formAction} className="space-y-4">
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
          {message && <p className="text-sm text-[#f43f5e] text-center mt-2">{message}</p>}

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
