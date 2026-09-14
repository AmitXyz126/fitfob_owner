import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkinApi, CheckinItemData } from '@/api/checkinApi';
import { useCheckinStore } from '@/store/useCheckinStore';
import { useAuthStore } from '@/store/useAuthStore';

export interface FormattedCheckinItem {
  id: string;
  documentId?: string;
  clientId: string;
  name: string;
  email?: string;
  time: string;
  rawTime: string;
  image: string;
  type: string;
  color: string;
  verified: boolean;
  subscriptionType?: string;
}

/**
 * Safely parse date string, handling missing timezone offsets
 */
export const parseCheckinDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  let str = String(dateStr).trim();
  // If ISO string without timezone indicator ('Z' or offset), append 'Z'
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) &&
    !str.includes('Z') &&
    !/[+-]\d{2}:\d{2}$/.test(str)
  ) {
    str += 'Z';
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date(dateStr) : d;
};

/**
 * Format ISO time into friendly relative + exact clock time string
 */
export const formatCheckinTime = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = parseCheckinDate(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));

    // Formatted 12-hour clock time (e.g. 11:43 AM)
    const timeFormatted = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (diffInMins < 1) return `Just now (${timeFormatted})`;
    if (diffInMins < 60) return `${diffInMins}m ago (${timeFormatted})`;

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) return timeFormatted;

    return (
      date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' • ' +
      timeFormatted
    );
  } catch {
    return dateStr;
  }
};

/**
 * Clean image url string if it contains markdown, brackets, or surrounding quotes
 * without stripping numbers like '2' from valid URLs
 */
export const cleanImageUrl = (rawVal: any): string => {
  if (!rawVal) return '';

  let str = '';
  if (typeof rawVal === 'string') {
    str = rawVal;
  } else if (Array.isArray(rawVal) && rawVal.length > 0) {
    return cleanImageUrl(rawVal[0]);
  } else if (typeof rawVal === 'object') {
    str =
      rawVal.url ||
      rawVal.uri ||
      rawVal.selfieUploadUrl ||
      rawVal.selfieUrl ||
      rawVal.path ||
      rawVal.src ||
      '';
  }

  if (!str || typeof str !== 'string') return '';

  let clean = str.trim();

  // If wrapped in markdown link [url](url)
  const markdownMatch = clean.match(/\((https?:\/\/[^\s\)]+)\)/);
  if (markdownMatch && markdownMatch[1]) {
    clean = markdownMatch[1];
  } else {
    // If wrapped in markdown brackets [url]
    const bracketMatch = clean.match(/^\[(.*)\]$/);
    if (bracketMatch && bracketMatch[1]) {
      clean = bracketMatch[1];
    }
  }

  // Remove leading and trailing double/single quotes
  clean = clean.replace(/^["']+|["']+$/g, '');

  // Remove URL encoded quote suffix or prefix (%22) without removing digit 2 from url
  clean = clean.replace(/%22$/gi, '');
  clean = clean.replace(/^%22/gi, '');

  // Remove trailing slashes or backslashes
  clean = clean.replace(/\\/g, '').trim();

  // If relative path from Strapi (e.g. /uploads/image.jpg)
  if (clean.startsWith('/')) {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
    if (baseUrl) {
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      clean = `${cleanBase}${clean}`;
    }
  }

  return clean;
};

/**
 * Resolve checkin image across various backend payload structures
 */
export const resolveCheckinImage = (item: any): string => {
  if (!item) return '';

  const candidate =
    item.selfieUploadUrl ||
    item.selfieUrl ||
    item.selfie_upload_url ||
    item.selfie_url ||
    item.selfie ||
    item.clientSelfie ||
    item.clientImage ||
    item.client_image ||
    item.clientPhoto ||
    item.userImage ||
    item.profileImage ||
    item.image ||
    item.avatar ||
    item.photo ||
    item.attributes?.selfieUploadUrl ||
    item.attributes?.selfieUrl ||
    item.attributes?.selfie ||
    item.attributes?.image ||
    item.client?.selfieUploadUrl ||
    item.client?.image ||
    item.user?.selfieUploadUrl ||
    item.user?.avatar ||
    '';

  const resolved = cleanImageUrl(candidate);
  return resolved;
};

/**
 * Get tier type name and badge color based on subscriptionType
 */
export const getSubscriptionBadge = (subscriptionType?: string) => {
  const type = (subscriptionType || 'standard').toLowerCase();
  if (type.includes('luxury')) {
    return { type: 'Luxury', color: '#F6163C' };
  }
  if (type.includes('premium')) {
    return { type: 'Premium', color: '#EAB308' };
  }
  if (type.includes('outdoor')) {
    return { type: 'Outdoor', color: '#10B981' };
  }
  if (type.includes('local')) {
    return { type: 'Local', color: '#3B82F6' };
  }
  return {
    type: subscriptionType ? subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1) : 'Standard',
    color: '#94A3B8',
  };
};

export const useTodayCheckins = (enabled: boolean = true) => {
  const { user } = useAuthStore();
  const setTodayCheckins = useCheckinStore((state) => state.setTodayCheckins);
  const userKey = user?.id || user?.email || 'guest';

  const [nowTicker, setNowTicker] = useState(Date.now());

  // Periodically tick every 15s to update relative times (e.g. Just now -> 1m ago)
  useEffect(() => {
    const timer = setInterval(() => setNowTicker(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const query = useQuery({
    queryKey: ['today-checkins', userKey],
    queryFn: checkinApi.getTodayCheckins,
    enabled: !!user && enabled,
    staleTime: 0, // Always consider stale so fresh data is fetched instantly
    refetchInterval: 5000, // Poll every 5 seconds for real-time live checkin updates
    refetchIntervalInBackground: false,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  // Keep Zustand store in sync with Query data
  useEffect(() => {
    if (query.data) {
      setTodayCheckins(query.data);
    }
  }, [query.data, setTodayCheckins]);

  // Transform raw checkins into formatted checkins for UI list
  const formattedCheckins: FormattedCheckinItem[] = useMemo(() => {
    const rawList = query.data || [];
    return rawList.map((item: any, index: number) => {
      const subType = item.subscriptionType || item.attributes?.subscriptionType || 'local';
      const { type, color } = getSubscriptionBadge(subType);
      const name =
        item.clientName ||
        item.name ||
        item.fullName ||
        item.userName ||
        item.attributes?.clientName ||
        item.client?.name ||
        'Member';
      const clientId =
        item.clientId ||
        item.attributes?.clientId ||
        item.client?.clientId ||
        (item.id ? `CL-${item.id}` : 'CL-000');
      const checkinTime =
        item.checkinTime ||
        item.createdAt ||
        item.attributes?.checkinTime ||
        item.attributes?.createdAt ||
        new Date().toISOString();

      const email =
        item.clientEmail ||
        item.email ||
        item.userEmail ||
        item.attributes?.clientEmail ||
        item.attributes?.email ||
        item.attributes?.user?.email ||
        item.client?.email ||
        item.user?.email ||
        item.customer?.email ||
        '';

      return {
        id: String(item.id || item.documentId || index),
        documentId: item.documentId || item.attributes?.documentId,
        clientId,
        name,
        email,
        time: formatCheckinTime(checkinTime),
        rawTime: checkinTime,
        image: resolveCheckinImage(item),
        type,
        color,
        verified: true,
        subscriptionType: subType,
      };
    });
  }, [query.data, nowTicker]);

  return {
    rawCheckins: query.data || [],
    checkins: formattedCheckins,
    count: (query.data || []).length,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
