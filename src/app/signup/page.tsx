import { SignupForm } from './signup-form'

export default function SignupPage() {
  return <SignupForm requiresInvite={Boolean(process.env.SIGNUP_INVITE_CODE)} />
}
