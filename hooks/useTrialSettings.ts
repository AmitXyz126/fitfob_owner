import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trialApi, TrialSettingsResponse, UpdateTrialSettingsPayload } from '@/api/trialApi';
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

  const isTrialEnabled = query.data?.isTrialEnabled ?? false;
  const dailyTrialLimit = query.data?.dailyTrialLimit ?? 5;

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

  const { allTrials, todayTrials, tomorrowTrials, upcomingTrials, freeLeadsCount } = useMemo(() => {
    const trials =
      Array.isArray(query.data?.trials) && query.data.trials.length > 0
        ? query.data.trials
        : [
            ...(Array.isArray(query.data?.todayTrials) ? query.data.todayTrials : []),
            ...(Array.isArray(query.data?.tomorrowTrials) ? query.data.tomorrowTrials : []),
          ];

    const today = Array.isArray(query.data?.todayTrials)
      ? query.data.todayTrials
      : trials.filter((t) => {
          const d = (t.trialDate || '').split('T')[0];
          return d === todayStr;
        });

    const tomorrow = Array.isArray(query.data?.tomorrowTrials)
      ? query.data.tomorrowTrials
      : trials.filter((t) => {
          const d = (t.trialDate || '').split('T')[0];
          return d === tomorrowStr;
        });

    const upcoming = trials.filter((t) => {
      const d = (t.trialDate || '').split('T')[0];
      return d > tomorrowStr;
    });

    let leads = 0;
    if (typeof query.data?.monthlyLeads === 'number') {
      leads = query.data.monthlyLeads;
    } else if (typeof query.data?.freeLeadsThisMonth === 'number') {
      leads = query.data.freeLeadsThisMonth;
    } else {
      const thisMonth = trials.filter((t) => {
        const d = (t.trialDate || '').split('T')[0];
        return d.startsWith(currentMonthPrefix);
      });
      leads = thisMonth.length > 0 ? thisMonth.length : trials.length;
    }

    return {
      allTrials: trials,
      todayTrials: today,
      tomorrowTrials: tomorrow,
      upcomingTrials: upcoming,
      freeLeadsCount: leads,
    };
  }, [query.data, todayStr, tomorrowStr, currentMonthPrefix]);

  // Minimum allowed slots cannot be less than today's booked/filled trial count
  const minLimit = todayTrials.length;

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateTrialSettingsPayload) => trialApi.updateTrialSettings(payload),
    onMutate: async (newPayload: UpdateTrialSettingsPayload) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['trial-settings'] });

      // Snapshot previous value for rollback
      const previousSettings = queryClient.getQueryData<TrialSettingsResponse>(['trial-settings']);

      // Optimistically update React Query cache immediately
      queryClient.setQueryData<TrialSettingsResponse>(['trial-settings'], (old) => {
        if (!old) return old;
        return {
          ...old,
          isTrialEnabled: newPayload.isTrialEnabled,
          dailyTrialLimit: newPayload.dailyTrialLimit,
        };
      });

      return { previousSettings };
    },
    onSuccess: (updatedData) => {
      // Recall GET /api/club-owner/trial-settings to refetch fresh server state
      queryClient.invalidateQueries({ queryKey: ['trial-settings'] });
      Toast.show({
        type: 'success',
        text1: 'Settings Updated',
        text2: `Trials ${updatedData.isTrialEnabled ? 'enabled' : 'disabled'} with ${updatedData.dailyTrialLimit} slots/day`,
        visibilityTime: 2000,
      });
    },
    onError: (err: any, _newPayload, context: any) => {
      // Rollback to snapshot on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['trial-settings'], context.previousSettings);
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
    updateMutation.mutate({
      isTrialEnabled: nextVal,
      dailyTrialLimit,
    });
  }, [isTrialEnabled, dailyTrialLimit, updateMutation]);

  const incrementLimit = useCallback(() => {
    const nextLimit = dailyTrialLimit + 1;
    updateMutation.mutate({
      isTrialEnabled,
      dailyTrialLimit: nextLimit,
    });
  }, [dailyTrialLimit, isTrialEnabled, updateMutation]);

  const decrementLimit = useCallback(() => {
    if (dailyTrialLimit <= minLimit) {
      Toast.show({
        type: 'info',
        text1: 'Minimum Limit Reached',
        text2: `Cannot set slots lower than today's ${minLimit} booked trial${minLimit === 1 ? '' : 's'}.`,
        visibilityTime: 2500,
      });
      return;
    }
    const nextLimit = Math.max(minLimit, dailyTrialLimit - 1);
    updateMutation.mutate({
      isTrialEnabled,
      dailyTrialLimit: nextLimit,
    });
  }, [dailyTrialLimit, minLimit, isTrialEnabled, updateMutation]);

  return {
    settings: query.data,
    trials: allTrials,
    todayTrials,
    tomorrowTrials,
    upcomingTrials,
    isTrialEnabled,
    dailyTrialLimit,
    minLimit,
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
