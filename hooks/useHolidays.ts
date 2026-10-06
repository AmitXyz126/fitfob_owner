import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { holidayApi, HolidayItemData, CreateHolidayPayload } from '@/api/holidayApi';
import { useAuthStore } from '@/store/useAuthStore';

const HOLIDAYS_CACHE_PREFIX = '@fitfob_club_holidays_';

export const useHolidays = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userKey = user?.id || user?.email || 'guest';
  const cacheKey = `${HOLIDAYS_CACHE_PREFIX}${userKey}`;

  // 1. Query all holidays
  const query = useQuery<HolidayItemData[]>({
    queryKey: ['holidays', userKey],
    queryFn: async () => {
      try {
        const remoteData = await holidayApi.getHolidays();
        if (Array.isArray(remoteData)) {
          // Keep any unsynced local offline items so they never disappear
          const cached = await AsyncStorage.getItem(cacheKey);
          const localList: HolidayItemData[] = cached ? JSON.parse(cached) : [];
          const localOnly = localList.filter((item) => String(item.id).startsWith('local_'));
          const combined = [...localOnly, ...remoteData];
          await AsyncStorage.setItem(cacheKey, JSON.stringify(combined));
          return combined;
        }
      } catch (err) {
        console.warn('Network error fetching holidays, checking local cache:', err);
      }

      // Fallback to local storage if network fails or offline
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return [];
        }
      }
      return [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // 2. Mutation to create a holiday
  const createMutation = useMutation({
    mutationFn: async (payload: CreateHolidayPayload) => {
      let createdItem: HolidayItemData | null = null;
      try {
        createdItem = await holidayApi.createHoliday(payload);
      } catch (err) {
        console.warn('API error creating holiday, adding to local fallback:', err);
        // Create optimistic fallback item if backend has auth/permission issues
        const isFull = payload.closureType === 'full_day';
        createdItem = {
          id: `local_${Date.now()}`,
          title: payload.title,
          closureType: payload.closureType,
          startDate: payload.startDate,
          endDate: payload.endDate,
          startTime: isFull ? undefined : (payload.startTime || '10:00:00.000'),
          endtime: isFull ? undefined : (payload.endtime || payload.endTime || '18:00:00.000'),
          endTime: isFull ? undefined : (payload.endTime || payload.endtime || '18:00:00.000'),
          createdAt: new Date().toISOString(),
        };
      }

      // Update local storage
      const cached = await AsyncStorage.getItem(cacheKey);
      const list: HolidayItemData[] = cached ? JSON.parse(cached) : [];
      const updatedList = [createdItem, ...list];
      await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedList));

      return createdItem;
    },
    onSuccess: (createdItem) => {
      if (createdItem) {
        queryClient.setQueryData<HolidayItemData[]>(['holidays', userKey], (old = []) => {
          const exists = old.some(
            (h) => (createdItem.documentId && h.documentId === createdItem.documentId) || h.id === createdItem.id
          );
          if (exists) return old;
          return [createdItem, ...old];
        });
      }
      queryClient.invalidateQueries({ queryKey: ['holidays', userKey] });
    },
  });

  // 3. Mutation to delete a holiday
  const deleteMutation = useMutation({
    mutationFn: async (holiday: HolidayItemData) => {
      const deleteId = holiday.documentId || holiday.id;
      try {
        if (deleteId && !String(deleteId).startsWith('local_')) {
          await holidayApi.deleteHoliday(deleteId);
        }
      } catch (err) {
        console.warn('API error deleting holiday, removing from local storage:', err);
      }

      // Remove from local cache
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const list: HolidayItemData[] = JSON.parse(cached);
        const filtered = list.filter(
          (item) => item.id !== holiday.id && item.documentId !== holiday.documentId
        );
        await AsyncStorage.setItem(cacheKey, JSON.stringify(filtered));
      }

      return holiday;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', userKey] });
    },
  });

  return {
    ...query,
    holidays: query.data || [],
    createHoliday: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteHoliday: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
