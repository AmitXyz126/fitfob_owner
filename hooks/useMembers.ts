import { useQuery } from '@tanstack/react-query';
import { memberApi, MemberListItem, MemberDetailsResponse } from '@/api/memberApi';
import { useMemberStore, MemberFilterType } from '@/store/useMemberStore';
import { useEffect, useMemo } from 'react';

/**
 * Format plan key (e.g. "twelve_months") to friendly display string (e.g. "12 Months Plan")
 */
export const formatPlanName = (plan?: string): string => {
  if (!plan) return 'Membership Plan';
  const clean = plan.toLowerCase().trim();
  switch (clean) {
    case 'twelve_months':
    case '12_months':
    case '12months':
    case 'annual':
    case 'yearly':
      return '12 Months Plan';
    case 'six_months':
    case '6_months':
    case '6months':
      return '6 Months Plan';
    case 'three_months':
    case '3_months':
    case '3months':
      return '3 Months Plan';
    case 'monthly':
    case '1_month':
    case '1month':
      return 'Monthly Plan';
    default:
      return (
        clean
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') + ' Plan'
      );
  }
};

/**
 * Format duration number in months (e.g. 12 -> "12 Months", 1 -> "1 Month")
 */
export const formatDurationMonths = (duration: number | string): string => {
  const num = typeof duration === 'string' ? parseInt(duration, 10) : duration;
  if (isNaN(num) || num === 0) return 'Custom';
  if (num === 1) return '1 Month';
  return `${num} Months`;
};

/**
 * Format date ISO string (e.g. "2026-11-14") to "14 Nov 2026"
 */
export const formatMemberDate = (dateString?: string): string => {
  if (!dateString) return '--';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Hook to fetch and manage the member list
 */
export const useMemberList = () => {
  const {
    members,
    setMembers,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
  } = useMemberStore();

  const query = useQuery<MemberListItem[]>({
    queryKey: ['member-list'],
    queryFn: memberApi.getMemberList,
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (query.data) {
      setMembers(query.data);
    }
  }, [query.data, setMembers]);

  // Compute counts
  const allList = query.data || members || [];
  const activeCount = useMemo(
    () => allList.filter((m) => m.status?.toLowerCase() === 'active').length,
    [allList]
  );
  const inactiveCount = useMemo(
    () => allList.filter((m) => m.status?.toLowerCase() !== 'active').length,
    [allList]
  );
  const allCount = allList.length;

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return allList.filter((member) => {
      // 1. Status Filter
      const status = member.status?.toLowerCase() || '';
      if (activeFilter === 'active' && status !== 'active') return false;
      if (activeFilter === 'inactive' && status === 'active') return false;

      // 2. Search Query
      if (searchQuery.trim().length > 0) {
        const queryLower = searchQuery.toLowerCase().trim();
        const nameMatch = member.name?.toLowerCase().includes(queryLower);
        const planMatch = member.plan?.toLowerCase().includes(queryLower);
        return nameMatch || planMatch;
      }

      return true;
    });
  }, [allList, activeFilter, searchQuery]);

  return {
    members: filteredMembers,
    rawMembers: allList,
    allCount,
    activeCount,
    inactiveCount,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    error: query.error,
  };
};

/**
 * Hook to fetch and manage member details by document ID
 */
export const useMemberDetails = (docId: string | undefined) => {
  const { selectedMemberDetails, setSelectedMemberDetails } = useMemberStore();

  const query = useQuery<MemberDetailsResponse>({
    queryKey: ['member-details', docId],
    queryFn: () => {
      if (!docId) throw new Error('Document ID is required');
      return memberApi.getMemberDetails(docId);
    },
    enabled: Boolean(docId),
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (query.data) {
      setSelectedMemberDetails(query.data);
    }
  }, [query.data, setSelectedMemberDetails]);

  const details = query.data || selectedMemberDetails;

  // Active membership if any
  const activeMembership = useMemo(() => {
    return details?.memberships?.find(
      (m) => m.membershipStatus?.toLowerCase() === 'active'
    ) || details?.memberships?.[0];
  }, [details]);

  // Total checkins count calculation
  const totalCheckinCount = useMemo(() => {
    if (typeof details?.totalCheckins === 'number') return details.totalCheckins;
    if (typeof details?.totalVisits === 'number') return details.totalVisits;
    if (typeof details?.client?.totalCheckins === 'number') return details.client.totalCheckins;
    if (typeof details?.client?.totalVisits === 'number') return details.client.totalVisits;
    if (Array.isArray(details?.checkins) && details.checkins.length > 0) {
      return details.checkins.length;
    }
    return 0;
  }, [details]);

  const hasCheckins = totalCheckinCount > 0;

  return {
    details,
    client: details?.client,
    memberships: details?.memberships || [],
    activeMembership,
    totalCheckinCount,
    hasCheckins,
    checkins: details?.checkins || [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    error: query.error,
  };
};
