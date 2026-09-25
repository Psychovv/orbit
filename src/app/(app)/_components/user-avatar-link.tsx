"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useLocalString } from "@/shared/lib/use-local-preference";
import { PROFILE_STORAGE_KEYS } from "@/features/profile/data/profile.local";

/** Avatar no header: usa cache local na 1ª pintura e hidrata com a API. */
export function UserAvatarLink() {
  const { data: profile } = useProfile();
  const [cachedPhoto] = useLocalString(PROFILE_STORAGE_KEYS.PHOTO);
  const photo = profile?.photo ?? cachedPhoto;

  return (
    <Link
      href="/settings"
      title="Configurações / Perfil"
      aria-label="Abrir configurações do perfil"
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:ring-2 hover:ring-brand/50 transition-all"
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <User className="h-4 w-4" />
      )}
    </Link>
  );
}
