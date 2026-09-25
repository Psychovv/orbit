"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/config/data-source";
import type { Profile } from "../data/profile.repository";
import { useLocalString } from "@/shared/lib/use-local-preference";
import { PROFILE_STORAGE_KEYS } from "../data/profile.local";
import { useEffect } from "react";

const PROFILE_KEY = "profile";

export function useProfile() {
  const query = useQuery({
    queryKey: [PROFILE_KEY],
    queryFn: () => repositories.profile.get(),
  });

  // Sync with local storage for Greeting component if needed
  const [, setLocalName] = useLocalString(PROFILE_STORAGE_KEYS.NAME);
  
  useEffect(() => {
    if (query.data?.name) {
      setLocalName(query.data.name);
    }
  }, [query.data?.name, setLocalName]);

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
      if (data.name !== undefined) {
        setLocalName(data.name ?? "");
      }
      return { previous };
    },
    onError: (_err, _new, context) => {
      if (context?.previous) {
        queryClient.setQueryData([PROFILE_KEY], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY] });
    },
  });
}
