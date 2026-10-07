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
    onMutate: async (deletedHoliday: HolidayItemData) => {
      await queryClient.cancelQueries({ queryKey: ['holidays', userKey] });
      const previousHolidays = queryClient.getQueryData<HolidayItemData[]>(['holidays', userKey]);

      // Optimistically remove from React Query memory cache immediately
      queryClient.setQueryData<HolidayItemData[]>(['holidays', userKey], (old = []) => {
        return old.filter(
          (item) =>
            item.id !== deletedHoliday.id &&
            (!deletedHoliday.documentId || item.documentId !== deletedHoliday.documentId)
        );
      });

      return { previousHolidays };
    },
    onError: (_err, _deletedHoliday, context) => {
      if (context?.previousHolidays) {
        queryClient.setQueryData(['holidays', userKey], context.previousHolidays);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', userKey] });
    },
  });

  // 4. Mutation to update a holiday
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      documentId,
      payload,
    }: {
      id?: string | number;
      documentId?: string;
      payload: CreateHolidayPayload;
    }) => {
      const updateId = documentId || id;
      let updatedItem: HolidayItemData | null = null;
      try {
        if (updateId && !String(updateId).startsWith('local_')) {
          updatedItem = await holidayApi.updateHoliday(updateId, payload);
        }
      } catch (err) {
        console.warn('API error updating holiday, updating local fallback:', err);
      }

      // Fallback if network failed or local item
      if (!updatedItem) {
        const isFull = payload.closureType === 'full_day';
        updatedItem = {
          id: id || `local_${Date.now()}`,
          documentId: documentId,
          title: payload.title,
          closureType: payload.closureType,
          startDate: payload.startDate,
          endDate: payload.endDate,
          startTime: isFull ? undefined : (payload.startTime || '10:00:00.000'),
          endtime: isFull ? undefined : (payload.endtime || payload.endTime || '18:00:00.000'),
          endTime: isFull ? undefined : (payload.endTime || payload.endtime || '18:00:00.000'),
          updatedAt: new Date().toISOString(),
        };
      }

      // Update local cache
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const list: HolidayItemData[] = JSON.parse(cached);
        const updatedList = list.map((item) =>
          (documentId && item.documentId === documentId) || (id && item.id === id)
            ? { ...item, ...updatedItem }
            : item
        );
        await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedList));
      }

      return updatedItem;
    },
    onSuccess: (updatedItem) => {
      if (updatedItem) {
        queryClient.setQueryData<HolidayItemData[]>(['holidays', userKey], (old = []) => {
          return old.map((h) =>
            (updatedItem.documentId && h.documentId === updatedItem.documentId) || h.id === updatedItem.id
              ? { ...h, ...updatedItem }
              : h
          );
        });
      }
      queryClient.invalidateQueries({ queryKey: ['holidays', userKey] });
    },
  });

  return {
    ...query,
    holidays: query.data || [],
    createHoliday: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateHoliday: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteHoliday: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
