/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from 'react';
import { useQuery, useQueryClient, keepPreviousData, UseQueryOptions } from '@tanstack/react-query';
import {
  trialApi,
  TrialGuestsResponse,
  TrialGuestsQueryParams,
  TrialGuestItem,
} from '@/api/trialApi';

export { keepPreviousData };

export interface UseTrialGuestsOptions
  extends Omit<UseQueryOptions<TrialGuestsResponse, Error>, 'queryKey' | 'queryFn'> {
  filter?: 'all' | 'today' | 'tomorrow' | 'by-date' | string;
  date?: string;
  search?: string;
}

export const useTrialGuests = (options?: UseTrialGuestsOptions) => {
  const queryClient = useQueryClient();
  const filter = options?.filter || 'all';
  const selectedDate = options?.date;
  const searchQuery = (options?.search || '').trim().toLowerCase();

  // Construct query parameters: if filter is 'all', we can pass it or omit it
  const queryParams: TrialGuestsQueryParams = useMemo(() => {
    const p: TrialGuestsQueryParams = {};
    if (filter) {
      p.filter = filter;
    }
    if (selectedDate && filter === 'by-date') {
      p.date = selectedDate;
    }
    if (searchQuery) {
      p.search = searchQuery;
    }
    return p;
  }, [filter, selectedDate, searchQuery]);

  const query = useQuery<TrialGuestsResponse, Error>({
    queryKey: ['trial-guests', queryParams],
    queryFn: () => trialApi.getTrialGuests(queryParams),
    staleTime: 60 * 1000,
    retry: 1,
    placeholderData: options?.placeholderData ?? keepPreviousData,
    ...options,
  });

  const rawData = query.data;

  // Filter trials by search if requested locally as well
  const filterBySearch = (list: TrialGuestItem[]) => {
    if (!searchQuery) return list;
    return list.filter(
      (item) =>
        (item.clientName && item.clientName.toLowerCase().includes(searchQuery)) ||
        (item.clientPhone && item.clientPhone.toLowerCase().includes(searchQuery)) ||
        (item.clientId && item.clientId.toLowerCase().includes(searchQuery))
    );
  };

  const allTrials = useMemo(() => {
    const list = rawData?.data || rawData?.trials || [];
    return filterBySearch(list);
  }, [rawData?.data, rawData?.trials, searchQuery]);

  // Today and tomorrow dates
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const tmr = new Date(now);
  tmr.setDate(tmr.getDate() + 1);
  const tomorrowStr = `${tmr.getFullYear()}-${String(tmr.getMonth() + 1).padStart(2, '0')}-${String(tmr.getDate()).padStart(2, '0')}`;

  const todayTrials = useMemo(() => {
    return allTrials.filter((t) => (t.trialDate || '').split('T')[0] === todayStr);
  }, [allTrials, todayStr]);

  const tomorrowTrials = useMemo(() => {
    return allTrials.filter((t) => (t.trialDate || '').split('T')[0] === tomorrowStr);
  }, [allTrials, tomorrowStr]);

  const processedGroupedByDate = useMemo(() => {
    const list = rawData?.groupedByDate || [];
    if (!searchQuery) return list;

    return list
      .map((g) => ({
        ...g,
        trials: filterBySearch(g.trials),
      }))
      .filter((g) => g.trials.length > 0);
  }, [rawData?.groupedByDate, searchQuery]);

  const processedGroups = useMemo(() => {
    const rawGroups = rawData?.groups;
    const hasRaw =
      (rawGroups?.toArrive?.length || 0) > 0 ||
      (rawGroups?.checkedIn?.length || 0) > 0 ||
      (rawGroups?.cancelled?.length || 0) > 0 ||
      (rawGroups?.noShow?.length || 0) > 0;

    let baseGroups = rawGroups;
    if (!hasRaw && allTrials.length > 0) {
      baseGroups = {
        toArrive: todayTrials.filter(
          (t) =>
            t.trialStatus === 'booked' ||
            t.trialStatus === 'pending' ||
            t.trialStatus === 'rescheduled'
        ),
        checkedIn: todayTrials.filter(
          (t) => t.trialStatus === 'completed' || t.trialStatus === 'checked-in'
        ),
        cancelled: todayTrials.filter((t) => t.trialStatus === 'cancelled'),
        noShow: todayTrials.filter(
          (t) =>
            t.trialStatus === 'no-show' ||
            t.trialStatus === 'missed' ||
            t.trialStatus === 'expired'
        ),
      };
    }

    const fallbackGroups = {
      toArrive: baseGroups?.toArrive || [],
      checkedIn: baseGroups?.checkedIn || [],
      cancelled: baseGroups?.cancelled || [],
      noShow: baseGroups?.noShow || [],
    };

    if (!searchQuery) return fallbackGroups;

    return {
      toArrive: filterBySearch(fallbackGroups.toArrive),
      checkedIn: filterBySearch(fallbackGroups.checkedIn),
      cancelled: filterBySearch(fallbackGroups.cancelled),
      noShow: filterBySearch(fallbackGroups.noShow),
    };
  }, [rawData?.groups, allTrials, todayTrials, searchQuery]);

  const tabCounts = useMemo(() => {
    return {
      all: rawData?.tabCounts?.all ?? allTrials.length,
      today: rawData?.tabCounts?.today ?? todayTrials.length,
      tomorrow: rawData?.tabCounts?.tomorrow ?? tomorrowTrials.length,
    };
  }, [rawData?.tabCounts, allTrials.length, todayTrials.length, tomorrowTrials.length]);

  const summary = useMemo(() => {
    if (rawData?.summary && (rawData.summary.total > 0 || rawData.summary.checkedIn > 0)) {
      return rawData.summary;
    }
    const checkedIn = allTrials.filter(
      (t) => t.trialStatus === 'completed' || t.trialStatus === 'checked-in'
    ).length;
    const upcoming = allTrials.filter(
      (t) =>
        t.trialStatus === 'booked' ||
        t.trialStatus === 'pending' ||
        t.trialStatus === 'rescheduled'
    ).length;
    const missed = allTrials.filter(
      (t) =>
        t.trialStatus === 'no-show' ||
        t.trialStatus === 'missed' ||
        t.trialStatus === 'expired'
    ).length;
    const cancelled = allTrials.filter((t) => t.trialStatus === 'cancelled').length;

    return {
      total: allTrials.length,
      checkedIn,
      upcoming,
      missed,
      cancelled,
    };
  }, [rawData?.summary, allTrials]);

  return {
    data: rawData,
    club: rawData?.club,
    tabCounts,
    summary,
    allTrials,
    todayTrials,
    tomorrowTrials,
    groupedByDate: processedGroupedByDate,
    groups: processedGroups,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    error: query.error,
    refetch: query.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['trial-guests'] }),
  };
};
