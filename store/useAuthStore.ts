
import { storageAPI } from "@/utility/storage";
import { create } from "zustand";
 
interface AuthStore {
  user: any | null;
  setUser: (user: any | null, rememberMe?: boolean) => Promise<void>;
  logOut: () => Promise<void>;
}

const STORAGE_KEY = "authUser";

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,

  setUser: async (user, rememberMe = false) => {
    set({ user });

    if (!user) {
      await storageAPI.removeItem(STORAGE_KEY);
      return;
    }

     const ttlMinutes = rememberMe ? undefined : 1440; 
    await storageAPI.setItem(STORAGE_KEY, JSON.stringify(user), ttlMinutes);
  },

  logOut: async () => {
    await storageAPI.removeItem(STORAGE_KEY);
    set({ user: null });
  },
}));