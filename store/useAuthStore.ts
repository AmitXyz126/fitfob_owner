import { storageAPI } from '@/utility/storage';
import { create } from 'zustand';

 interface User {
  id: number;
  username: string;
  email: string;
  token: string;
  role?: any;
  [key: string]: any;
}

interface AuthStore {
  user: User | null;
  setUser: (user: User | null, rememberMe?: boolean) => Promise<void>;
  logOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const STORAGE_KEY = 'authUser';

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,

  setUser: async (user, rememberMe = false) => {
     set({ user });

    if (!user) {
      await storageAPI.removeItem(STORAGE_KEY);
      return;
    }

    try {
       const ttlMinutes = rememberMe ? undefined : 1440;
      await storageAPI.setItem(STORAGE_KEY, JSON.stringify(user), ttlMinutes);
    } catch (error) {
      console.error('Failed to save user to storage', error);
    }
  },

  logOut: async () => {
    try {
      await storageAPI.removeItem(STORAGE_KEY);
      set({ user: null });
    } catch (error) {
      console.error('Logout failed', error);
    }
  },

  initializeAuth: async () => {
    try {
      const storedUser = await storageAPI.getItem(STORAGE_KEY);

      if (storedUser) {
         const parsedUser = typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser;

        set({ user: parsedUser });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
       await storageAPI.removeItem(STORAGE_KEY);
      set({ user: null });
    }
  },
}));
