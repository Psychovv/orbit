export interface Profile {
  id: string;
  name: string | null;
  photo: string | null;
  bio: string | null;
}

export interface ProfileRepository {
  get(): Promise<Profile>;
  update(data: Partial<Profile>): Promise<Profile>;
}
