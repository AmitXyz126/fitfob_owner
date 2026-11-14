import { create } from 'zustand';
import { memberApi, MemberListItem, MemberDetailsResponse } from '@/api/memberApi';

export type MemberFilterType = 'all' | 'active' | 'inactive';

interface MemberStore {
  members: MemberListItem[];
  selectedMemberDetails: MemberDetailsResponse | null;
  activeFilter: MemberFilterType;
  searchQuery: string;
  isLoading: boolean;
  isDetailsLoading: boolean;
  error: string | null;

  setMembers: (members: MemberListItem[]) => void;
  setSelectedMemberDetails: (details: MemberDetailsResponse | null) => void;
  setActiveFilter: (filter: MemberFilterType) => void;
  setSearchQuery: (query: string) => void;

  fetchMemberList: () => Promise<MemberListItem[]>;
  fetchMemberDetails: (docId: string) => Promise<MemberDetailsResponse | null>;
  reset: () => void;
}

export const useMemberStore = create<MemberStore>((set, get) => ({
  members: [],
  selectedMemberDetails: null,
  activeFilter: 'all',
  searchQuery: '',
  isLoading: false,
  isDetailsLoading: false,
  error: null,

  setMembers: (members) => set({ members, error: null }),
  setSelectedMemberDetails: (details) => set({ selectedMemberDetails: details }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  fetchMemberList: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await memberApi.getMemberList();
      set({ members: data, isLoading: false });
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch members list';
      set({ error: message, isLoading: false });
      return [];
    }
  },

  fetchMemberDetails: async (docId: string) => {
    set({ isDetailsLoading: true, error: null });
    try {
      const data = await memberApi.getMemberDetails(docId);
      set({ selectedMemberDetails: data, isDetailsLoading: false });
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch member details';
      set({ error: message, isDetailsLoading: false });
      return null;
    }
  },

  reset: () =>
    set({
      members: [],
      selectedMemberDetails: null,
      activeFilter: 'all',
      searchQuery: '',
      isLoading: false,
      isDetailsLoading: false,
      error: null,
    }),
}));
