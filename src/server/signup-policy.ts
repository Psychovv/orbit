import { timingSafeEqual } from "crypto";

export function inviteRequired(): boolean {
  return Boolean(process.env.SIGNUP_INVITE_CODE);
}

/** Com `SIGNUP_INVITE_CODE` definido, criar conta exige esse código. Sem ele, o cadastro é aberto. */
export function inviteCodeMatches(code: string): boolean {
  const expected = process.env.SIGNUP_INVITE_CODE;
  if (!expected) return true;
  const a = Buffer.from(code.trim());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
