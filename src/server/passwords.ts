import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "crypto";

/** Parâmetros do scrypt gravados junto com o hash, para poder subir o custo depois. */
const PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key)
    );
  });
}

/** Formato: `scrypt$N$r$p$salt$hash` (salt e hash em base64url). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const key = await derive(password, Buffer.from(saltB64, "base64url"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Hash de uma senha qualquer, para o login gastar o mesmo tempo quando o e-mail não existe. */
let dummyHash: Promise<string> | null = null;
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}
