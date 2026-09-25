'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from './actions'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { OrbitMark } from '@/shared/ui/orbit-mark'

const initialState: LoginState = {}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090812] text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#100e1e] border border-[#231f38] shadow-2xl">
        <div className="flex justify-center mb-8">
          <OrbitMark className="w-16 h-16 text-[#844DFE]" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Entrar no Orbit</h1>
          <p className="text-[#9a94b0]">Acesse seu sistema pessoal</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <Input 
              name="email" 
              type="email" 
              placeholder="Email" 
              required 
              className="w-full bg-[#151324] border-[#231f38]"
            />
          </div>
          
          <div>
            <Input 
              name="password" 
              type="password" 
              placeholder="Senha" 
              required 
              className="w-full bg-[#151324] border-[#231f38]"
            />
          </div>

          {state.error && (
            <p className="text-sm text-[#f43f5e] text-center mt-2">
              {state.error}
            </p>
          )}

          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-[#844DFE] hover:bg-[#723ce6] text-white"
          >
            {isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
