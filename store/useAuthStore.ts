import { storageAPI } from '@/utility/storage';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

 interface User {
  id: number;
  username: string;
  email: string;
  token: string;
  role?: any;
  verification_status?:string
  [key: string]: any;
}

interface AuthStore {
  user: User | null;
  setUser: (user: User | null, rememberMe?: boolean) => Promise<void>;
  logOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const STORAGE_KEY = 'authUser';

// Keep user-filled club profile, onboarding data, photos, and documents intact across logout and login.
// Only session tokens are removed on logout.
const clearUserDrafts = async () => {
  // Deliberately no-op: Preserve user data so it persists across logout/login
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,

  setUser: async (user, rememberMe = false) => {
    if (!user) {
      set({ user: null });
      await storageAPI.removeItem(STORAGE_KEY);
      return;
    }

    set({ user });

    try {
      const ttlMinutes = rememberMe ? undefined : 1440;
      await storageAPI.setItem(STORAGE_KEY, JSON.stringify(user), ttlMinutes);
    } catch (error) {
      console.error('Failed to save user to storage', error);
    }
  },

  logOut: async () => {
    try {
      set({ user: null });
      await storageAPI.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Logout failed', error);
      set({ user: null });
    }
  },

  initializeAuth: async () => {
    try {
      const storedUser = await storageAPI.getItem(STORAGE_KEY);

      if (storedUser) {
        const parsedUser = typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser;
        if (parsedUser && (parsedUser.token || parsedUser.jwt)) {
          set({ user: parsedUser });
        } else {
          set({ user: null });
        }
      } else {
        set({ user: null });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      await storageAPI.removeItem(STORAGE_KEY);
      await clearUserDrafts();
      set({ user: null });
    }
  },
}));
