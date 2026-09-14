import { create } from 'zustand';
import { checkinApi, CheckinItemData } from '@/api/checkinApi';

interface CheckinStore {
  todayCheckins: CheckinItemData[];
  isLoading: boolean;
  error: string | null;
  setTodayCheckins: (checkins: CheckinItemData[]) => void;
  fetchTodayCheckins: () => Promise<CheckinItemData[]>;
  resetCheckins: () => void;
}

export const useCheckinStore = create<CheckinStore>((set) => ({
  todayCheckins: [],
  isLoading: false,
  error: null,

  setTodayCheckins: (todayCheckins: CheckinItemData[]) => {
    set({ todayCheckins });
  },

  fetchTodayCheckins: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await checkinApi.getTodayCheckins();
      set({ todayCheckins: data, isLoading: false });
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch today check-ins';
      set({ error: message, isLoading: false });
      return [];
    }
  },

  resetCheckins: () => {
    set({ todayCheckins: [], isLoading: false, error: null });
  },
}));
