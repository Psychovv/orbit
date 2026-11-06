import { z } from "zod";

/** Foto do perfil: só imagem embutida (data URL). A CSP já bloqueia imagens externas. ~200 KB no máximo. */
export const ProfilePhotoSchema = z
  .string()
  .max(200_000, "Foto grande demais.")
  .regex(/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/, "Foto inválida.");

export const ProfileNameSchema = z.string().trim().max(100, "Nome longo demais.");
export const ProfileBioSchema = z.string().trim().max(1000, "Bio longa demais.");

/** Corpo do `PUT /api/profile`: campos opcionais; `null` limpa o campo. Chaves extras são descartadas. */
export const UpdateProfileSchema = z.object({
  name: ProfileNameSchema.nullable().optional(),
  photo: ProfilePhotoSchema.nullable().optional(),
  bio: ProfileBioSchema.nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
