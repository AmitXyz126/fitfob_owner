import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageAPI = {
   setItem: async (key: string, value: string, ttlMinutes?: number) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error("Storage Error (Set):", e);
    }
  },

   getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (e) {
      console.error("Storage Error (Get):", e);
      return null;
    }
  },

   removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error("Storage Error (Remove):", e);
    }
  }
};