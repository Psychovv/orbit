import { isGoogleConfigured } from '@/server/google-oauth'
import { authErrorMessage } from './auth-errors'
import { LoginForm } from './login-form'

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { error } = await searchParams
  return <LoginForm googleEnabled={isGoogleConfigured()} error={authErrorMessage(error)} />
}
