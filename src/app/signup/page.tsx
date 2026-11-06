import { authErrorMessage } from '@/app/login/auth-errors'
import { isGoogleConfigured } from '@/server/google-oauth'
import { inviteRequired } from '@/server/signup-policy'
import { SignupForm } from './signup-form'

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { error } = await searchParams
  return (
    <SignupForm
      requiresInvite={inviteRequired()}
      googleEnabled={isGoogleConfigured()}
      error={authErrorMessage(error)}
    />
  )
}
