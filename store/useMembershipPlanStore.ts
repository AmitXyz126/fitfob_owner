import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  membershipPlanApi,
  LocalMembershipPlan,
  CreatePlanPayload,
  UpdatePlanPayload,
} from '@/api/membershipPlanApi';

const CACHE_STORAGE_KEY = '@fitfob_membership_plans_cache_v1';

const LEGACY_STORAGE_KEY = '@club_membership_plans_v1';

const syncToStorage = async (plans: LocalMembershipPlan[]) => {
  const json = JSON.stringify(plans);
  await Promise.allSettled([
    AsyncStorage.setItem(CACHE_STORAGE_KEY, json),
    AsyncStorage.setItem(LEGACY_STORAGE_KEY, json),
  ]);
};

interface MembershipPlanStore {
  plans: LocalMembershipPlan[];
  isLoading: boolean;
  error: string | null;

  setPlans: (plans: LocalMembershipPlan[]) => void;
  loadCachedPlans: () => Promise<LocalMembershipPlan[]>;
  fetchPlans: () => Promise<LocalMembershipPlan[]>;
  createPlan: (payload: CreatePlanPayload) => Promise<LocalMembershipPlan | null>;
  updatePlan: (documentId: string, payload: UpdatePlanPayload) => Promise<LocalMembershipPlan | null>;
  deletePlan: (documentId: string) => Promise<boolean>;
  toggleStatus: (documentId: string, isActive: boolean) => Promise<boolean>;
  reset: () => void;
}

export const useMembershipPlanStore = create<MembershipPlanStore>((set, get) => ({
  plans: [],
  isLoading: false,
  error: null,

  setPlans: (plans: LocalMembershipPlan[]) => {
    set({ plans, error: null });
    syncToStorage(plans).catch((e) =>
      console.warn('Failed to cache membership plans to AsyncStorage:', e)
    );
  },

  loadCachedPlans: async () => {
    try {
      let cached = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
      if (!cached) {
        cached = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      }
      if (cached) {
        const parsed: LocalMembershipPlan[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ plans: parsed });
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading cached membership plans:', e);
    }
    return [];
  },

  fetchPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await membershipPlanApi.getMyPlans();
      set({ plans: data, isLoading: false, error: null });
      await syncToStorage(data);
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch membership plans';

      // Fallback to cache if network error
      const cached = await get().loadCachedPlans();
      set({ isLoading: false, error: message });
      return cached;
    }
  },

  createPlan: async (payload: CreatePlanPayload) => {
    try {
      const res = await membershipPlanApi.createPlan(payload);
      // Refresh list to keep backend in sync
      const updatedList = await membershipPlanApi.getMyPlans();
      get().setPlans(updatedList);
      return res.data || updatedList.find((p) => p.planName === payload.planName) || null;
    } catch (err: any) {
      console.error('Store error creating plan:', err);
      throw err;
    }
  },

  updatePlan: async (documentId: string, payload: UpdatePlanPayload) => {
    // Optimistic update
    const previous = get().plans;
    const optimisticList = previous.map((p) =>
      p.documentId === documentId || String(p.id) === documentId ? { ...p, ...payload } : p
    );
    set({ plans: optimisticList });

    try {
      const res = await membershipPlanApi.updatePlan(documentId, payload);
      // Fetch fresh plans or update state with returned data
      const refreshedList = await membershipPlanApi.getMyPlans();
      get().setPlans(refreshedList);
      return res.data || null;
    } catch (err: any) {
      // Revert optimistic update on failure
      set({ plans: previous });
      console.error('Store error updating plan:', err);
      throw err;
    }
  },

  deletePlan: async (documentId: string) => {
    // Optimistic delete
    const previous = get().plans;
    const filtered = previous.filter(
      (p) => p.documentId !== documentId && String(p.id) !== documentId
    );
    set({ plans: filtered });

    try {
      await membershipPlanApi.deletePlan(documentId);
      await syncToStorage(filtered);
      return true;
    } catch (err: any) {
      // Revert on failure
      set({ plans: previous });
      console.error('Store error deleting plan:', err);
      throw err;
    }
  },

  toggleStatus: async (documentId: string, isActive: boolean) => {
    // Optimistic toggle
    const previous = get().plans;
    const updated = previous.map((p) =>
      p.documentId === documentId || String(p.id) === documentId ? { ...p, isActive } : p
    );
    set({ plans: updated });

    try {
      await membershipPlanApi.togglePlanStatus(documentId, isActive);
      await syncToStorage(updated);
      return true;
    } catch (err: any) {
      // Revert on failure
      set({ plans: previous });
      console.error('Store error toggling plan status:', err);
      throw err;
    }
  },

  reset: () => {
    set({ plans: [], isLoading: false, error: null });
  },
}));
