"use client";

import React, { useState, useEffect } from "react";
import { User, Image as ImageIcon } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { useProfile, useUpdateProfile } from "@/features/profile/hooks/use-profile";

export function UserProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [draftName, setDraftName] = useState("");
  const [draftPhoto, setDraftPhoto] = useState("");
  const [draftBio, setDraftBio] = useState("");

  const handleOpen = () => {
    setDraftName(profile?.name ?? "");
    setDraftPhoto(profile?.photo ?? "");
    setDraftBio(profile?.bio ?? "");
    setIsOpen(true);
  };

  const handleSave = () => {
    updateProfile.mutate({
      name: draftName.trim(),
      photo: draftPhoto.trim(),
      bio: draftBio.trim(),
    });
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:ring-2 hover:ring-brand/50 transition-all cursor-pointer"
        title="Meu Perfil"
      >
        {profile?.photo ? (
          <img src={profile.photo} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Meu Perfil"
        description="Atualize suas informações pessoais."
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700">
              {draftPhoto ? (
                <img src={draftPhoto} alt="Avatar Preview" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-zinc-400" />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                URL da Foto
              </label>
              <input
                type="text"
                value={draftPhoto}
                onChange={(e) => setDraftPhoto(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            
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

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong transition-colors shadow-sm shadow-brand/25 cursor-pointer"
            >
              Salvar Perfil
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
