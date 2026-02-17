import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageAPI = {
  // Data save karne ke liye (Login ke time)
  setItem: async (key: string, value: string, ttlMinutes?: number) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error("Storage Error (Set):", e);
    }
  },

  // Data wapas nikalne ke liye (App open hote waqt)
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (e) {
      console.error("Storage Error (Get):", e);
      return null;
    }
  },

  // Data delete karne ke liye (Logout ke time)
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error("Storage Error (Remove):", e);
    }
  }
};