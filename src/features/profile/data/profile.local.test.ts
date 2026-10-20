import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalProfileRepository, PROFILE_STORAGE_KEYS } from "./profile.local";

function installBrowser() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  const dispatchEvent = vi.fn();
  vi.stubGlobal("localStorage", localStorage);
  vi.stubGlobal("window", { localStorage, dispatchEvent });
  return { store, dispatchEvent };
}

describe("local profile repository", () => {
  let store: Map<string, string>;
  let dispatchEvent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.unstubAllGlobals();
    ({ store, dispatchEvent } = installBrowser());
  });

  it("returns an empty profile when nothing is saved", async () => {
    const repo = createLocalProfileRepository();
    expect(await repo.get()).toEqual({ id: "owner", name: null, photo: null, bio: null });
  });

  it("returns an empty profile on the server", async () => {
    vi.unstubAllGlobals();
    const repo = createLocalProfileRepository();
    expect(await repo.get()).toEqual({ id: "owner", name: null, photo: null, bio: null });
  });

  it("saves the provided fields and notifies other listeners", async () => {
    const repo = createLocalProfileRepository();
    const profile = await repo.update({ name: "Vini", bio: "Orbitando" });

    expect(profile).toEqual({ id: "owner", name: "Vini", photo: null, bio: "Orbitando" });
    expect(store.get(PROFILE_STORAGE_KEYS.NAME)).toBe("Vini");
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "storage" }));
  });

  it("keeps fields that are not part of the update", async () => {
    store.set(PROFILE_STORAGE_KEYS.PHOTO, "data:image/png;base64,abc");
    const repo = createLocalProfileRepository();

    const profile = await repo.update({ name: "Vini" });
    expect(profile.photo).toBe("data:image/png;base64,abc");
  });

  it("clears fields set to null or empty", async () => {
    store.set(PROFILE_STORAGE_KEYS.NAME, "Vini");
    store.set(PROFILE_STORAGE_KEYS.BIO, "Orbitando");
    const repo = createLocalProfileRepository();

    const profile = await repo.update({ name: null, bio: "" });
    expect(profile).toMatchObject({ name: null, bio: null });
    expect(store.has(PROFILE_STORAGE_KEYS.NAME)).toBe(false);
    expect(store.has(PROFILE_STORAGE_KEYS.BIO)).toBe(false);
  });
});
