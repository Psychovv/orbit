import type { ProfileRepository } from "./profile.repository";

export const PROFILE_STORAGE_KEYS = {
  NAME: "orbit_user_name",
  PHOTO: "orbit_user_photo",
  BIO: "orbit_user_bio",
};

export function createLocalProfileRepository(): ProfileRepository {
  return {
    async get() {
      if (typeof window === "undefined") return { id: "owner", name: null, photo: null, bio: null };
      return {
        id: "owner",
        name: localStorage.getItem(PROFILE_STORAGE_KEYS.NAME),
        photo: localStorage.getItem(PROFILE_STORAGE_KEYS.PHOTO),
        bio: localStorage.getItem(PROFILE_STORAGE_KEYS.BIO),
      };
    },
    async update(data) {
      if (typeof window !== "undefined") {
        if (data.name !== undefined) {
          if (data.name) localStorage.setItem(PROFILE_STORAGE_KEYS.NAME, data.name);
          else localStorage.removeItem(PROFILE_STORAGE_KEYS.NAME);
        }
        if (data.photo !== undefined) {
          if (data.photo) localStorage.setItem(PROFILE_STORAGE_KEYS.PHOTO, data.photo);
          else localStorage.removeItem(PROFILE_STORAGE_KEYS.PHOTO);
        }
        if (data.bio !== undefined) {
          if (data.bio) localStorage.setItem(PROFILE_STORAGE_KEYS.BIO, data.bio);
          else localStorage.removeItem(PROFILE_STORAGE_KEYS.BIO);
        }
        window.dispatchEvent(new Event("storage"));
      }
      return this.get();
    },
  };
}
