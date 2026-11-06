/** Tira a coluna `user_id` da linha antes de devolver para o cliente. */
export function omitUserId<T extends { userId: string }>(row: T): Omit<T, "userId"> {
  const copy: Partial<T> = { ...row };
  delete copy.userId;
  return copy as Omit<T, "userId">;
}
