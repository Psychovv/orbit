"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/config/data-source";
import type { Profile } from "../data/profile.repository";
import { useLocalString } from "@/shared/lib/use-local-preference";
import { PROFILE_STORAGE_KEYS } from "../data/profile.local";

export const PROFILE_KEY = "profile";

function syncLocalProfile(profile: Partial<Profile>) {
  if (typeof window === "undefined") return;
  try {
    if (profile.name !== undefined) {
      if (profile.name) localStorage.setItem(PROFILE_STORAGE_KEYS.NAME, profile.name);
      else localStorage.removeItem(PROFILE_STORAGE_KEYS.NAME);
    }
    if (profile.photo !== undefined) {
      if (profile.photo) localStorage.setItem(PROFILE_STORAGE_KEYS.PHOTO, profile.photo);
      else localStorage.removeItem(PROFILE_STORAGE_KEYS.PHOTO);
    }
    if (profile.bio !== undefined) {
      if (profile.bio) localStorage.setItem(PROFILE_STORAGE_KEYS.BIO, profile.bio);
      else localStorage.removeItem(PROFILE_STORAGE_KEYS.BIO);
    }
    window.dispatchEvent(new Event("storage"));
  } catch {
    // quota / private mode — ignore local cache
  }
}

export function useProfile() {
  const query = useQuery({
    queryKey: [PROFILE_KEY],
    queryFn: () => repositories.profile.get(),
    staleTime: 60_000,
    retry: 1,
  });

  const [, setLocalName] = useLocalString(PROFILE_STORAGE_KEYS.NAME);

  useEffect(() => {
    if (!query.data) return;
    syncLocalProfile(query.data);
    if (query.data.name) setLocalName(query.data.name);
  }, [query.data, setLocalName]);

  return query;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const [, setLocalName] = useLocalString(PROFILE_STORAGE_KEYS.NAME);

  return useMutation({
    mutationFn: (data: Partial<Profile>) => repositories.profile.update(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: [PROFILE_KEY] });
      const previous = queryClient.getQueryData<Profile>([PROFILE_KEY]);
      if (previous) {
        queryClient.setQueryData<Profile>([PROFILE_KEY], { ...previous, ...data });
      }
      syncLocalProfile(data);
      if (data.name !== undefined) {
        setLocalName(data.name ?? "");
      }
      return { previous };
    },
    onError: (_err, _new, context) => {
      if (context?.previous) {
        queryClient.setQueryData([PROFILE_KEY], context.previous);
        syncLocalProfile(context.previous);
      }
    },
    onSuccess: (saved) => {
      queryClient.setQueryData([PROFILE_KEY], saved);
      syncLocalProfile(saved);
    },
  });
}
