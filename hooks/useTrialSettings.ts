import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  trialApi,
  TrialSettingsResponse,
  TrialItem,
  UpdateTrialSettingsPayload,
} from '@/api/trialApi';
import Toast from 'react-native-toast-message';

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useTrialSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery<TrialSettingsResponse>({
    queryKey: ['trial-settings'],
    queryFn: trialApi.getTrialSettings,
    staleTime: 60 * 1000,
    retry: 1,
  });

  // Optimistic local state for smooth interaction
  const [isTrialEnabled, setIsTrialEnabled] = useState<boolean>(false);
  const [dailyTrialLimit, setDailyTrialLimit] = useState<number>(5);

  useEffect(() => {
    if (query.data) {
      setIsTrialEnabled(query.data.isTrialEnabled);
      setDailyTrialLimit(query.data.dailyTrialLimit);
    }
  }, [query.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateTrialSettingsPayload) =>
      trialApi.updateTrialSettings(payload),
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['trial-settings'], (old: TrialSettingsResponse | undefined) => {
        if (!old) return updatedData;
        return {
          ...old,
          isTrialEnabled: updatedData.isTrialEnabled,
          dailyTrialLimit: updatedData.dailyTrialLimit,
        };
      });
      Toast.show({
        type: 'success',
        text1: 'Settings Updated',
        text2: `Trials ${updatedData.isTrialEnabled ? 'enabled' : 'disabled'} with ${updatedData.dailyTrialLimit} slots/day`,
        visibilityTime: 2000,
      });
    },
    onError: (err: any) => {
      // Revert to query data on failure
      if (query.data) {
        setIsTrialEnabled(query.data.isTrialEnabled);
        setDailyTrialLimit(query.data.dailyTrialLimit);
      }
      Toast.show({
        type: 'error',
        text1: 'Failed to update settings',
        text2: err?.response?.data?.message || err?.message || 'Please try again',
      });
    },
  });

  const toggleTrialEnabled = useCallback(() => {
    const nextVal = !isTrialEnabled;
    setIsTrialEnabled(nextVal);
    updateMutation.mutate({
      isTrialEnabled: nextVal,
      dailyTrialLimit,
    });
  }, [isTrialEnabled, dailyTrialLimit, updateMutation]);

  const incrementLimit = useCallback(() => {
    const nextLimit = dailyTrialLimit + 1;
    setDailyTrialLimit(nextLimit);
    updateMutation.mutate({
      isTrialEnabled,
      dailyTrialLimit: nextLimit,
    });
  }, [dailyTrialLimit, isTrialEnabled, updateMutation]);

  const decrementLimit = useCallback(() => {
    if (dailyTrialLimit <= 0) return;
    const nextLimit = Math.max(0, dailyTrialLimit - 1);
    setDailyTrialLimit(nextLimit);
    updateMutation.mutate({
      isTrialEnabled,
      dailyTrialLimit: nextLimit,
    });
  }, [dailyTrialLimit, isTrialEnabled, updateMutation]);

  // Categorize trials by date
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const tomorrowStr = useMemo(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return getLocalDateString(tm);
  }, []);

  const currentMonthPrefix = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const allTrials = useMemo(() => query.data?.trials || [], [query.data?.trials]);

  const todayTrials = useMemo(() => {
    return allTrials.filter((t) => {
      const d = (t.trialDate || '').split('T')[0];
      return d === todayStr;
    });
  }, [allTrials, todayStr]);

  const tomorrowTrials = useMemo(() => {
    return allTrials.filter((t) => {
      const d = (t.trialDate || '').split('T')[0];
      return d === tomorrowStr;
    });
  }, [allTrials, tomorrowStr]);

  const upcomingTrials = useMemo(() => {
    return allTrials.filter((t) => {
      const d = (t.trialDate || '').split('T')[0];
      return d > tomorrowStr;
    });
  }, [allTrials, tomorrowStr]);

  const freeLeadsCount = useMemo(() => {
    if (typeof query.data?.freeLeadsThisMonth === 'number') {
      return query.data.freeLeadsThisMonth;
    }
    // Calculate trials registered this month
    const thisMonthTrials = allTrials.filter((t) => {
      const d = (t.trialDate || '').split('T')[0];
      return d.startsWith(currentMonthPrefix);
    });
    return thisMonthTrials.length > 0 ? thisMonthTrials.length : allTrials.length;
  }, [query.data?.freeLeadsThisMonth, allTrials, currentMonthPrefix]);

  return {
    settings: query.data,
    trials: allTrials,
    todayTrials,
    tomorrowTrials,
    upcomingTrials,
    isTrialEnabled,
    dailyTrialLimit,
    freeLeadsCount,
    toggleTrialEnabled,
    incrementLimit,
    decrementLimit,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isUpdating: updateMutation.isPending,
    refetch: query.refetch,
    error: query.error,
  };
};
