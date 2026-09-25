"use client";

import React, { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/features/profile/hooks/use-profile";

const MAX_AVATAR_SIDE = 256;
const JPEG_QUALITY = 0.82;

async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_AVATAR_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export function ProfileForm() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draftName, setDraftName] = useState("");
  const [draftPhoto, setDraftPhoto] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDraftName(profile.name ?? "");
    setDraftPhoto(profile.photo ?? "");
    setDraftBio(profile.bio ?? "");
  }, [profile]);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    updateProfile.mutate(
      {
        name: draftName.trim(),
        photo: draftPhoto.trim() || null,
        bio: draftBio.trim(),
      },
      {
        onSuccess: () => {
          setSavedFlash(true);
          window.setTimeout(() => setSavedFlash(false), 1800);
        },
      }
    );
  };

  const handlePhotoPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Selecione um arquivo de imagem.");
      return;
    }

    setIsProcessingPhoto(true);
    setPhotoError("");
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setDraftPhoto(dataUrl);
    } catch {
      setPhotoError("Não foi possível carregar essa imagem.");
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="mx-auto h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700">
          {draftPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draftPhoto} alt="Avatar Preview" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-zinc-400" />
          )}
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-start">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoPick}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingPhoto}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {isProcessingPhoto ? "Processando…" : draftPhoto ? "Trocar foto" : "Enviar foto"}
            </button>
            {draftPhoto ? (
              <button
                type="button"
                onClick={() => {
                  setDraftPhoto("");
                  setPhotoError("");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </button>
            ) : null}
          </div>
          {photoError ? (
            <p className="text-xs text-red-500">{photoError}</p>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              JPG, PNG ou WebP — a imagem é redimensionada automaticamente.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nome
          </label>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Seu nome"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Bio
          </label>
          <textarea
            value={draftBio}
            onChange={(e) => setDraftBio(e.target.value)}
            placeholder="Uma breve descrição sobre você"
            rows={3}
            className="w-full resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {savedFlash ? (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Perfil salvo
          </span>
        ) : null}
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong transition-colors shadow-sm shadow-brand/25 cursor-pointer disabled:opacity-60"
        >
          {updateProfile.isPending ? "Salvando…" : "Salvar perfil"}
        </button>
      </div>
    </form>
  );
}
