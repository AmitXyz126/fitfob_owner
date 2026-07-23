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

const clearUserDrafts = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const draftKeys = keys.filter(
      (k) =>
        k.includes('onboarding') ||
        k.includes('club_profile') ||
        k.includes('authUser')
    );
    if (draftKeys.length > 0) {
      await AsyncStorage.multiRemove(draftKeys);
    }
  } catch (e) {
    console.error('Error clearing user drafts:', e);
  }
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,

  setUser: async (user, rememberMe = false) => {
    const currentUser = get().user;
    if (!user || !currentUser || currentUser.id !== user.id || currentUser.email !== user.email) {
      await clearUserDrafts();
    }
    set({ user });

    if (!user) {
      await storageAPI.removeItem(STORAGE_KEY);
      await clearUserDrafts();
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
      await clearUserDrafts();
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
      await clearUserDrafts();
      set({ user: null });
    }
  },
}));
