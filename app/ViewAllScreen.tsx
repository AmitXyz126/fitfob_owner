import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Container } from '@/components/Container';
import { useTodayCheckins, parseCheckinDate, FormattedCheckinItem } from '@/hooks/useTodayCheckins';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withRepeat,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

// Dynamic item sizing for check-in animated list
const ITEM_SIZE = 84;
const PAGE_SIZE = 10;

type CheckinListItem =
  | (FormattedCheckinItem & { isSkeleton?: false })
  | { id: string; isSkeleton: true };


const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatDateToYMD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getItemDates = (item: any): string[] => {
  const dates = new Set<string>();
  if (!item) return [];

  const candidates = [
    typeof item === 'string' ? item : null,
    item.rawTime,
    item.checkinTime,
    item.createdAt,
    item.date,
    item.time,
    item.attributes?.checkinTime,
    item.attributes?.createdAt,
    item.attributes?.date,
  ];

  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') continue;
    const str = raw.trim();

    // 1. Direct YYYY-MM-DD match (e.g. 2026-10-16...)
    const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      dates.add(`${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`);
    }

    // 2. Direct DD-MM-YYYY or DD/MM/YYYY match
    const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      dates.add(`${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`);
    }

    // 3. Local date parsed from Date object
    try {
      const d = parseCheckinDate(str);
      if (!isNaN(d.getTime())) {
        dates.add(formatDateToYMD(d));
      }
    } catch {}
  }

  return Array.from(dates);
};

const formatShortDate = (ymdStr?: string | null): string => {
  if (!ymdStr) return '';
  const parts = ymdStr.split('-');
  if (parts.length !== 3) return ymdStr;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return `${d} ${monthNames[m] || ''}`;
};

const formatDisplayDate = (ymdStr?: string | null): string => {
  if (!ymdStr) return '';
  const parts = ymdStr.split('-');
  if (parts.length !== 3) return ymdStr;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const y = parts[0];
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return `${d} ${monthNames[m] || ''}, ${y}`;
};

const SkeletonBox = ({ style, className }: { style?: any; className?: string }) => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 750 }),
        withTiming(0.35, { duration: 750 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[style, animatedStyle]}
      className={`bg-slate-200 ${className || ''}`}
    />
  );
};

const CheckinItemSkeleton = () => (
  <View
    style={{ elevation: 1 }}
    className="mb-4 flex-row items-center rounded-2xl border border-[#E5E7EB] bg-white p-3.5">
    <SkeletonBox className="h-14 w-14 rounded-2xl" />
    <View className="ml-4 flex-1">
      <SkeletonBox className="h-4 w-32 rounded-md mb-2" />
      <SkeletonBox className="h-3 w-20 rounded-md" />
    </View>
    <SkeletonBox className="h-7 w-20 rounded-full" />
  </View>
);

const CheckinItem = ({ item, index, scrollY, onSelect }: any) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * ITEM_SIZE,
      index * ITEM_SIZE,
      (index + 1) * ITEM_SIZE,
    ];

    const scale = interpolate(
      scrollY.value,
      inputRange,
      [1, 1, 0.92],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      inputRange,
      [1, 1, 0.65],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      inputRange,
      [0, 0, -12],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  const hasValidImage = Boolean(item.image && !imageError);

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onSelect(item)}
        style={{ elevation: 1 }}
        className="mb-4 flex-row items-center rounded-2xl border border-[#E5E7EB] bg-white p-3.5">
        {/* User Avatar with Skeleton while loading */}
        <View className="relative h-14 w-14 overflow-hidden rounded-2xl bg-slate-100 items-center justify-center">
          {!imageLoaded && hasValidImage && (
            <SkeletonBox style={StyleSheet.absoluteFill} />
          )}
          <Image
            source={
              hasValidImage
                ? { uri: item.image }
                : require('../assets/images/fitfob_profile.png')
            }
            className="h-14 w-14 rounded-2xl"
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
            onLoadEnd={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
        </View>

        {/* User Details */}
        <View className="ml-4 flex-1">
          <View className="flex-row items-center">
            <Text className="mr-1 font-bold text-[15px] text-slate-900">{item.name}</Text>
            {item.verified && (
              <Image className="h-4 w-4" source={require('../assets/images/tick.png')} />
            )}
          </View>
          <Text className="mt-0.5 font-medium text-xs text-slate-400">{item.time}</Text>
        </View>

        {/* Membership Badge with Image */}
        <View
          style={{
            backgroundColor: `${item.color}15`,
            borderColor: `${item.color}25`,
            width: 90,
          }}
          className="flex-row items-center justify-center rounded-full border py-1.5">
          <Image
            source={
              item.type === 'Luxury'
                ? require('../assets/images/luxury.png')
                : item.type === 'Premium'
                  ? require('../assets/images/premium.png')
                  : require('../assets/images/standardicon.png')
            }
            style={{ width: 14, height: 14 }}
            resizeMode="contain"
          />
          <Text style={{ color: item.color }} className="ml-1.5 font-bold text-[11px]">
            {item.type}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ViewAllScreen = () => {
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'local' | 'outdoor'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);

  // Custom Calendar Modal States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);
  const [activeDateStep, setActiveDateStep] = useState<'from' | 'to'>('from');

  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [showPagination, setShowPagination] = useState(false);
  const paginationAnim = useSharedValue(0);
  const flatListRef = useRef<any>(null);

  const dateParams = useMemo(() => {
    if (dateFilter === 'today') {
      const todayStr = formatDateToYMD(new Date());
      return { date: todayStr, startDate: todayStr, endDate: todayStr };
    }
    if (dateFilter === 'yesterday') {
      const yestStr = formatDateToYMD(new Date(Date.now() - 86400000));
      return { date: yestStr, startDate: yestStr, endDate: yestStr };
    }
    if (dateFilter === 'custom' && customStartDate) {
      const end = customEndDate || customStartDate;
      return {
        startDate: customStartDate,
        endDate: end,
        from: customStartDate,
        to: end,
      };
    }
    return undefined;
  }, [dateFilter, customStartDate, customEndDate]);

  const { checkins: allCheckins, isLoading, refetch } = useTodayCheckins(true, dateParams);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      // When scrolled past ~200px (around the 7th item), show pagination
      if (event.contentOffset.y > 200) {
        runOnJS(setShowPagination)(true);
      } else if (event.contentOffset.y < 60) {
        runOnJS(setShowPagination)(false);
      }
    },
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    // When the 7th item (index >= 6) enters viewport
    const hasReached7th = viewableItems.some((v: any) => v.index !== undefined && v.index >= 6);
    if (hasReached7th) {
      setShowPagination(true);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
  }).current;

  // Refresh check-ins on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  const matchesDate = useCallback(
    (item: any) => {
      const itemDates = getItemDates(item);
      const todayStr = formatDateToYMD(new Date());
      const yesterdayStr = formatDateToYMD(new Date(Date.now() - 86400000));

      if (dateFilter === 'today') {
        if (itemDates.length === 0) return true;
        return itemDates.includes(todayStr);
      }
      if (dateFilter === 'yesterday') {
        if (itemDates.length === 0) return false;
        return itemDates.includes(yesterdayStr);
      }
      if (dateFilter === 'custom') {
        if (!customStartDate) return true;
        const start = customStartDate;
        const end = customEndDate || customStartDate;
        if (itemDates.length === 0) return true;
        return itemDates.some((d) => d >= start && d <= end);
      }
      return true;
    },
    [dateFilter, customStartDate, customEndDate]
  );

  const counts = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    const list = (allCheckins || []).filter((item) => {
      if (!matchesDate(item)) return false;
      if (!searchLower) return true;
      const name = (item.name || '').toLowerCase();
      return name.includes(searchLower);
    });

    const local = list.filter((i) =>
      (i.subscriptionType || i.type || '').toLowerCase().includes('local')
    ).length;
    const outdoor = list.filter((i) =>
      (i.subscriptionType || i.type || '').toLowerCase().includes('outdoor')
    ).length;

    return {
      all: list.length,
      local,
      outdoor,
    };
  }, [allCheckins, search, matchesDate]);

  const filteredData = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    return (allCheckins || []).filter((item) => {
      if (!matchesDate(item)) return false;
      const name = (item.name || '').toLowerCase();
      const matchesSearch = !searchLower || name.includes(searchLower);

      const subType = (item.subscriptionType || item.type || '').toLowerCase();
      let matchesFilter = true;
      if (filterType === 'local') {
        matchesFilter = subType.includes('local');
      } else if (filterType === 'outdoor') {
        matchesFilter = subType.includes('outdoor');
      }

      return matchesSearch && matchesFilter;
    });
  }, [allCheckins, search, filterType, matchesDate]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));

  const isPaginationVisible = totalPages > 1 && !isLoading && (showPagination || filteredData.length < 7);

  useEffect(() => {
    if (isPaginationVisible) {
      paginationAnim.value = withTiming(1, {
        duration: 320,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      paginationAnim.value = withTiming(0, {
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [isPaginationVisible]);

  const animatedPaginationStyle = useAnimatedStyle(() => {
    return {
      opacity: paginationAnim.value,
      transform: [
        {
          translateY: interpolate(
            paginationAnim.value,
            [0, 1],
            [70, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const paginatedData: CheckinListItem[] = useMemo(() => {
    if (isPageLoading) {
      return Array.from({ length: PAGE_SIZE }, (_, i) => ({
        id: `skeleton-page-${currentPage}-${i}`,
        isSkeleton: true as const,
      }));
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, currentPage, isPageLoading]);

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage && !isPageLoading) {
      setIsPageLoading(true);
      setCurrentPage(pageNumber);
      setShowPagination(false);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      // Lazy-load page data on demand with a smooth quick transition
      setTimeout(() => {
        setIsPageLoading(false);
      }, 200);
    }
  };

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    // Keep first 5 pages [1, 2, 3, 4, 5] fixed initially when on pages 1, 2, or 3
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    // When near the end, show the last 5 pages
    if (currentPage >= totalPages - 2) {
      return Array.from({ length: maxButtons }, (_, i) => totalPages - 4 + i);
    }
    // Centered window around active page
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setIsPageLoading(false);
    setShowPagination(false);
  }, [search, filterType, dateFilter, customStartDate, customEndDate]);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [calMonth, calYear]);

  const isCurrentOrFutureMonth = useMemo(() => {
    const now = new Date();
    return calYear > now.getFullYear() || (calYear === now.getFullYear() && calMonth >= now.getMonth());
  }, [calMonth, calYear]);

  const handlePrevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (isCurrentOrFutureMonth) return;
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(calMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const cellDate = `${calYear}-${mStr}-${dStr}`;

    const todayStr = formatDateToYMD(new Date());
    if (cellDate > todayStr) return;

    if (activeDateStep === 'from') {
      setTempStartDate(cellDate);
      if (tempEndDate && tempEndDate < cellDate) {
        setTempEndDate(null);
      }
      // AUTOMATICALLY SWITCH TO TO-DATE STEP!
      setActiveDateStep('to');
    } else {
      // activeDateStep === 'to'
      if (tempStartDate && cellDate < tempStartDate) {
        // Tapped before start date: make it new start date and stay on to-date
        setTempStartDate(cellDate);
        setTempEndDate(null);
        setActiveDateStep('to');
      } else {
        setTempEndDate(cellDate);
      }
    }
  };

  const openCalendarModal = (initialStep: 'from' | 'to' = 'from') => {
    const today = new Date();
    setActiveDateStep(initialStep);
    if (customStartDate) {
      const targetDate = initialStep === 'to' && customEndDate ? customEndDate : customStartDate;
      const parts = targetDate.split('-');
      setCalYear(parseInt(parts[0], 10));
      setCalMonth(parseInt(parts[1], 10) - 1);
      setTempStartDate(customStartDate);
      setTempEndDate(customEndDate || null);
    } else {
      setCalYear(today.getFullYear());
      setCalMonth(today.getMonth());
      setTempStartDate(formatDateToYMD(today));
      setTempEndDate(null);
    }
    setShowDatePicker(true);
  };

  const applyCustomDateFilter = () => {
    if (tempStartDate) {
      setCustomStartDate(tempStartDate);
      setCustomEndDate(tempEndDate || tempStartDate);
      setDateFilter('custom');
      setCurrentPage(1);
    }
    setShowDatePicker(false);
  };

  const selectQuickRange = (type: 'last7' | 'last14' | 'last30' | 'thisMonth') => {
    const today = new Date();
    const todayStr = formatDateToYMD(today);
    let startStr = todayStr;

    if (type === 'last7') {
      const d = new Date(Date.now() - 7 * 86400000);
      startStr = formatDateToYMD(d);
    } else if (type === 'last14') {
      const d = new Date(Date.now() - 14 * 86400000);
      startStr = formatDateToYMD(d);
    } else if (type === 'last30') {
      const d = new Date(Date.now() - 30 * 86400000);
      startStr = formatDateToYMD(d);
    } else if (type === 'thisMonth') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = formatDateToYMD(d);
    }

    setTempStartDate(startStr);
    setTempEndDate(todayStr);
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
  };

  return (
    <Container>
      {/* --- HEADER --- */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 10 : 20 }}
        className="mb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text className="font-medium text-base leading-6 text-[#697281]"> Check-ins</Text>

        <TouchableOpacity className="p-2">
          <Ionicons name="notifications" size={24} color="#F6163C" />
        </TouchableOpacity>
      </View>

      {/* --- PREMIUM INTERACTIVE SEARCH BAR --- */}
      <View className="mb-3">
        {/* Search Input Bar */}
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-1 shadow-sm shadow-slate-100">
          <Ionicons name="search" size={20} color="#F6163C" />
          <TextInput
            placeholder="Search members by name..."
            placeholderTextColor="#94A3B8"
            className="ml-3 h-11 flex-1 font-medium text-slate-800 text-sm"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearch('')}
              activeOpacity={0.7}
              className="rounded-full bg-slate-100 p-1.5">
              <Ionicons name="close" size={16} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1">
              <Text className="font-bold text-[11px] text-[#F6163C]">
                {filteredData.length} {filteredData.length === 1 ? 'member' : 'members'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* --- DATE FILTER BAR (Today & Yesterday on left, Custom Date on right) --- */}
      <View className="mb-3 flex-row items-center justify-between">
        {/* Left: Quick Date Pills (Today & Yesterday) */}
        <View className="flex-row items-center">
          {/* TODAY */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              setDateFilter('today');
              setCustomStartDate(null);
              setCustomEndDate(null);
              setCurrentPage(1);
            }}
            className={`mr-2.5 flex-row items-center rounded-xl px-4 py-2 border ${
              dateFilter === 'today'
                ? 'border-[#F6163C] bg-rose-50 shadow-xs'
                : 'border-slate-200 bg-white'
            }`}>
            <Ionicons
              name="today"
              size={13}
              color={dateFilter === 'today' ? '#F6163C' : '#64748B'}
            />
            <Text
              className={`ml-1.5 text-xs font-semibold ${
                dateFilter === 'today' ? 'text-[#F6163C]' : 'text-slate-600'
              }`}>
              Today
            </Text>
          </TouchableOpacity>

          {/* YESTERDAY */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              setDateFilter('yesterday');
              setCustomStartDate(null);
              setCustomEndDate(null);
              setCurrentPage(1);
            }}
            className={`flex-row items-center rounded-xl px-4 py-2 border ${
              dateFilter === 'yesterday'
                ? 'border-[#F6163C] bg-rose-50 shadow-xs'
                : 'border-slate-200 bg-white'
            }`}>
            <Ionicons
              name="time"
              size={13}
              color={dateFilter === 'yesterday' ? '#F6163C' : '#64748B'}
            />
            <Text
              className={`ml-1.5 text-xs font-semibold ${
                dateFilter === 'yesterday' ? 'text-[#F6163C]' : 'text-slate-600'
              }`}>
              Yesterday
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right: Custom Date Filter Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => openCalendarModal('from')}
          className={`flex-row items-center rounded-xl px-3 py-2 border ${
            dateFilter === 'custom'
              ? 'border-[#F6163C] bg-rose-50 shadow-xs'
              : 'border-slate-200 bg-white'
          }`}>
          <Ionicons
            name="calendar"
            size={14}
            color={dateFilter === 'custom' ? '#F6163C' : '#64748B'}
          />
          <Text
            numberOfLines={1}
            className={`ml-1.5 text-xs font-semibold ${
              dateFilter === 'custom'
                ? 'text-[#F6163C]'
                : 'text-slate-600'
            }`}>
            {dateFilter === 'custom' && customStartDate
              ? customEndDate && customEndDate !== customStartDate
                ? `${formatShortDate(customStartDate)} - ${formatShortDate(customEndDate)}`
                : formatShortDate(customStartDate)
              : 'Custom Date'}
          </Text>
          {dateFilter === 'custom' && (
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={(e) => {
                e.stopPropagation();
                setDateFilter('today');
                setCustomStartDate(null);
                setCustomEndDate(null);
                setCurrentPage(1);
              }}
              className="ml-1.5 rounded-full bg-rose-100 p-0.5">
              <Ionicons name="close" size={12} color="#F6163C" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* --- ATTRACTIVE SEGMENTED SWITCH FILTER BAR --- */}
      <View className="mb-4">
        <View className="flex-row items-center rounded-2xl bg-slate-100/90 p-1 border border-slate-200/60 shadow-xs">
          {/* ALL OPTION */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setFilterType('all')}
            style={
              filterType === 'all'
                ? {
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : {}
            }
            className={`flex-1 flex-row items-center justify-center py-2 rounded-xl border ${
              filterType === 'all'
                ? 'border-slate-200/70'
                : 'border-transparent'
            }`}>
            <Ionicons
              name={filterType === 'all' ? 'grid' : 'grid-outline'}
              size={13}
              color={filterType === 'all' ? '#F6163C' : '#64748B'}
            />
            <Text
              className={`ml-1.5 text-xs ${
                filterType === 'all' ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
              }`}>
              All
            </Text>
            <View
              className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                filterType === 'all' ? 'bg-rose-50 border border-rose-100' : 'bg-slate-200/70'
              }`}>
              <Text
                className={`text-[10px] font-bold ${
                  filterType === 'all' ? 'text-[#F6163C]' : 'text-slate-500'
                }`}>
                {counts.all}
              </Text>
            </View>
          </TouchableOpacity>

          {/* LOCAL OPTION */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setFilterType('local')}
            style={
              filterType === 'local'
                ? {
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : {}
            }
            className={`flex-1 flex-row items-center justify-center py-2 rounded-xl border ${
              filterType === 'local'
                ? 'border-blue-100'
                : 'border-transparent'
            }`}>
            <Ionicons
              name={filterType === 'local' ? 'home' : 'home-outline'}
              size={13}
              color={filterType === 'local' ? '#3B82F6' : '#64748B'}
            />
            <Text
              className={`ml-1.5 text-xs ${
                filterType === 'local' ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
              }`}>
              Local
            </Text>
            <View
              className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                filterType === 'local' ? 'bg-blue-50 border border-blue-100' : 'bg-slate-200/70'
              }`}>
              <Text
                className={`text-[10px] font-bold ${
                  filterType === 'local' ? 'text-[#3B82F6]' : 'text-slate-500'
                }`}>
                {counts.local}
              </Text>
            </View>
          </TouchableOpacity>

          {/* OUTDOOR OPTION */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setFilterType('outdoor')}
            style={
              filterType === 'outdoor'
                ? {
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : {}
            }
            className={`flex-1 flex-row items-center justify-center py-2 rounded-xl border ${
              filterType === 'outdoor'
                ? 'border-emerald-100'
                : 'border-transparent'
            }`}>
            <Ionicons
              name={filterType === 'outdoor' ? 'compass' : 'compass-outline'}
              size={13}
              color={filterType === 'outdoor' ? '#10B981' : '#64748B'}
            />
            <Text
              className={`ml-1.5 text-xs ${
                filterType === 'outdoor' ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
              }`}>
              Outdoor
            </Text>
            <View
              className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                filterType === 'outdoor' ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-200/70'
              }`}>
              <Text
                className={`text-[10px] font-bold ${
                  filterType === 'outdoor' ? 'text-[#10B981]' : 'text-slate-500'
                }`}>
                {counts.outdoor}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- ACTIVE DATE CONTEXT BANNER (Clear visibility for the owner) --- */}
      <View className="mb-3 flex-row items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2">
        <View className="flex-row items-center flex-1 mr-2">
          <Ionicons
            name={dateFilter === 'custom' ? 'calendar' : 'time-outline'}
            size={14}
            color="#F6163C"
          />
          <Text numberOfLines={1} className="ml-1.5 text-[11px] font-medium text-slate-600">
            Showing check-ins for:{' '}
            <Text className="font-bold text-slate-900">
              {dateFilter === 'today'
                ? `Today (${formatDisplayDate(formatDateToYMD(new Date()))})`
                : dateFilter === 'yesterday'
                ? `Yesterday (${formatDisplayDate(formatDateToYMD(new Date(Date.now() - 86400000)))})`
                : customStartDate && customEndDate && customStartDate !== customEndDate
                ? `${formatDisplayDate(customStartDate)}  →  ${formatDisplayDate(customEndDate)}`
                : customStartDate
                ? formatDisplayDate(customStartDate)
                : 'Selected Date'}
            </Text>
          </Text>
        </View>
        <View className="rounded-md bg-white border border-slate-200 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-slate-700">
            {counts[filterType]} check-in{counts[filterType] !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* --- RECENT CHECK-INS LIST / LOADING STATE --- */}
      {isLoading ? (
        <View className="flex-1 py-2">
          <CheckinItemSkeleton />
          <CheckinItemSkeleton />
          <CheckinItemSkeleton />
          <CheckinItemSkeleton />
        </View>
      ) : (
        <View className="flex-1">
          <Animated.FlatList
            ref={flatListRef}
            data={paginatedData}
            keyExtractor={(item, index) => item.id + index}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 110 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-4">
              <Image
                source={require('../assets/images/view_all_empty.png')}
                className="h-80 w-80"
                resizeMode="contain"
              />
              <Text className="mt-1 text-center font-bold text-lg text-slate-900">
                No Check-in History Found
              </Text>
              <Text className="mt-1 px-8 text-center text-[13px] leading-5 text-slate-500">
                {search.length > 0
                  ? 'No check-ins match your search criteria.'
                  : filterType !== 'all'
                  ? `No ${filterType === 'local' ? 'Local' : 'Outdoor'} check-ins found for ${
                      dateFilter === 'today'
                        ? 'today'
                        : dateFilter === 'yesterday'
                        ? 'yesterday'
                        : customStartDate && customEndDate && customStartDate !== customEndDate
                        ? `${formatDisplayDate(customStartDate)} to ${formatDisplayDate(customEndDate)}`
                        : customStartDate
                        ? formatDisplayDate(customStartDate)
                        : 'this period'
                    }.`
                  : `No check-ins found for ${
                      dateFilter === 'today'
                        ? 'today'
                        : dateFilter === 'yesterday'
                        ? 'yesterday'
                        : customStartDate && customEndDate && customStartDate !== customEndDate
                        ? `${formatDisplayDate(customStartDate)} to ${formatDisplayDate(customEndDate)}`
                        : customStartDate
                        ? formatDisplayDate(customStartDate)
                        : 'this period'
                    }.`}
              </Text>
              {(search.length > 0 || filterType !== 'all' || dateFilter !== 'today') && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch('');
                    setFilterType('all');
                    setDateFilter('today');
                    setCustomStartDate(null);
                    setCustomEndDate(null);
                    setCurrentPage(1);
                  }}
                  className="mt-4 rounded-full bg-[#F6163C] px-5 py-2.5 shadow-sm">
                  <Text className="font-semibold text-sm text-white">Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item, index }: { item: CheckinListItem; index: number }) => {
            if (item.isSkeleton) {
              return <CheckinItemSkeleton key={item.id} />;
            }
            return (
              <CheckinItem
                item={item}
                index={index}
                scrollY={scrollY}
                onSelect={(selected: any) => setSelectedMember({ ...selected, verified: true })}
              />
            );
          }}
        />
        </View>
      )}

      {/* --- FIXED BOTTOM PAGINATION BAR (Visible when scrolled to item 7 or page has < 7 items) --- */}
      {totalPages > 1 && !isLoading && (
        <Animated.View
          pointerEvents={isPaginationVisible ? 'auto' : 'none'}
          style={[
            styles.fixedPaginationContainer,
            {
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 12) + 6,
            },
            animatedPaginationStyle,
          ]}>
          {/* Numbered Pagination Row: [ < ] [ 1 ] [ 2 ] [ 3 ] [ > ] */}
          <View style={styles.paginationRow}>
            {/* Prev Button (<) */}
            <TouchableOpacity
              disabled={currentPage === 1 || isPageLoading}
              onPress={() => goToPage(currentPage - 1)}
              activeOpacity={0.7}
              style={[
                styles.navPageBtn,
                (currentPage === 1 || isPageLoading) && styles.navPageBtnDisabled,
              ]}>
              <Ionicons name="chevron-back" size={15} color="#475569" />
            </TouchableOpacity>

            {/* Page Numbers: [ 1 ] [ 2 ] [ 3 ] ... */}
            {pageNumbers.map((num) => {
              const isActive = num === currentPage;
              return (
                <TouchableOpacity
                  key={num}
                  disabled={isPageLoading}
                  onPress={() => goToPage(num)}
                  activeOpacity={0.8}
                  style={[
                    styles.pageNumberBtn,
                    isActive && styles.pageNumberBtnActive,
                  ]}>
                  <Text
                    style={[
                      styles.pageNumberText,
                      isActive && styles.pageNumberTextActive,
                    ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Next Button (>) */}
            <TouchableOpacity
              disabled={currentPage === totalPages || isPageLoading}
              onPress={() => goToPage(currentPage + 1)}
              activeOpacity={0.7}
              style={[
                styles.navPageBtn,
                (currentPage === totalPages || isPageLoading) && styles.navPageBtnDisabled,
              ]}>
              <Ionicons name="chevron-forward" size={15} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Subtitle Info */}
          <Text style={styles.paginationInfoText}>
            Page {currentPage} of {totalPages} • Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length} check-ins
          </Text>
        </Animated.View>
      )}

      {/* --- MEMBER DETAIL BOTTOM SHEET --- */}
      <Modal
        visible={Boolean(selectedMember)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMember(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedMember(null)} />
          {selectedMember && (
            <View style={styles.bottomSheet}>
              {/* Drag handle */}
              <View style={styles.dragHandle} />

              {/* Header with Close */}
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Member Profile</Text>
                <TouchableOpacity onPress={() => setSelectedMember(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.sheetContent}>
                {/* Top row: Avatar & basic info */}
                <View style={styles.profileHeader}>
                  <Image
                    source={
                      selectedMember?.image
                        ? { uri: selectedMember.image }
                        : require('../assets/images/fitfob_profile.png')
                    }
                    style={styles.largeAvatar}
                  />
                  <View style={styles.profileMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.profileName}>{selectedMember?.name || 'Member'}</Text>
                      {selectedMember?.verified && (
                        <Image
                          style={styles.checkIcon}
                          source={require('../assets/images/tick.png')}
                        />
                      )}
                    </View>
                    <Text style={styles.profileTime}>Checked in: {selectedMember?.time}</Text>

                    {/* Badge */}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: `${selectedMember?.color || '#F6163C'}15`,
                          borderColor: `${selectedMember?.color || '#F6163C'}25`,
                        },
                      ]}>
                      <Image
                        source={
                          selectedMember?.type === 'Luxury'
                            ? require('../assets/images/luxury.png')
                            : selectedMember?.type === 'Premium'
                              ? require('../assets/images/premium.png')
                              : require('../assets/images/standardicon.png')
                        }
                        style={{ width: 12, height: 12 }}
                        resizeMode="contain"
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          { color: selectedMember?.color || '#F6163C' },
                        ]}>
                        {selectedMember?.type} Member
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Detailed Parameters - Real Check-in Details */}
                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="time-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Check-in Time</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {selectedMember?.time || 'Today'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="ribbon-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Subscription</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {selectedMember?.subscriptionType || selectedMember?.type || 'Standard'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                      <Text style={[styles.detailLabel, { color: '#10B981', fontWeight: 'bold' }]}>
                        Status
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Checked In</Text>
                    </View>
                  </View>
                </View>

                {/* Bottom button */}
                <View style={styles.footerBtns}>
                  <TouchableOpacity
                    onPress={() => setSelectedMember(null)}
                    style={styles.primaryBtn}
                    activeOpacity={0.8}>
                    <Text style={styles.primaryBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
      {/* CUSTOM CALENDAR & DATE RANGE MODAL */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDatePicker(false)} />
          <View style={styles.bottomSheet}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Modal Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Filter by Date Range</Text>
                <Text className="text-[11px] text-slate-400 mt-0.5">
                  Select start and end date to filter check-ins
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Interactive Step-by-Step Selection Header Box */}
            <View className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
              <View className="flex-row items-center justify-between gap-2">
                {/* 1. FROM DATE TAB */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setActiveDateStep('from')}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    padding: 8,
                    borderWidth: activeDateStep === 'from' ? 2 : 1,
                    borderColor: activeDateStep === 'from' ? '#F6163C' : '#E2E8F0',
                    backgroundColor: activeDateStep === 'from' ? '#FFF1F2' : '#FFFFFF',
                  }}>
                  <View className="flex-row items-center justify-between">
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: 'bold',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: activeDateStep === 'from' ? '#F6163C' : '#64748B',
                      }}>
                      1. From Date
                    </Text>
                    {activeDateStep === 'from' ? (
                      <View className="rounded-full bg-[#F6163C] px-1.5 py-0.5">
                        <Text className="text-[8px] font-bold text-white">Active</Text>
                      </View>
                    ) : tempStartDate ? (
                      <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                    ) : null}
                  </View>
                  <Text numberOfLines={1} className="mt-1 text-xs font-bold text-slate-900">
                    {tempStartDate ? formatDisplayDate(tempStartDate) : 'Tap date below'}
                  </Text>
                </TouchableOpacity>

                {/* ARROW */}
                <View className="items-center justify-center">
                  <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
                </View>

                {/* 2. TO DATE TAB */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setActiveDateStep('to')}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    padding: 8,
                    borderWidth: activeDateStep === 'to' ? 2 : 1,
                    borderColor: activeDateStep === 'to' ? '#F6163C' : '#E2E8F0',
                    backgroundColor: activeDateStep === 'to' ? '#FFF1F2' : '#FFFFFF',
                  }}>
                  <View className="flex-row items-center justify-between">
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: 'bold',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: activeDateStep === 'to' ? '#F6163C' : '#64748B',
                      }}>
                      2. To Date
                    </Text>
                    {activeDateStep === 'to' ? (
                      <View className="rounded-full bg-[#F6163C] px-1.5 py-0.5">
                        <Text className="text-[8px] font-bold text-white">Active</Text>
                      </View>
                    ) : tempEndDate ? (
                      <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                    ) : null}
                  </View>
                  <Text numberOfLines={1} className="mt-1 text-xs font-bold text-slate-900">
                    {tempEndDate
                      ? formatDisplayDate(tempEndDate)
                      : tempStartDate
                      ? '(Select end date)'
                      : '—'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dynamic Guidance Banner */}
              <View className="mt-2 flex-row items-center justify-between px-1">
                <Text className="text-[11px] font-semibold text-slate-700 flex-1 mr-2">
                  {activeDateStep === 'from'
                    ? ' Step 1: Select "From Date" on the calendar'
                    : ' Step 2: Now select "To Date" (End Date)'}
                </Text>
                {activeDateStep === 'to' && tempStartDate && !tempEndDate && (
                  <TouchableOpacity
                    onPress={() => setTempEndDate(tempStartDate)}
                    className="rounded-md bg-rose-100 px-2 py-0.5 border border-rose-200 active:bg-rose-200">
                    <Text className="text-[10px] font-bold text-[#F6163C]">Same Day</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Quick Presets */}
            <View className="flex-row items-center justify-between mb-3 gap-1.5">
              <TouchableOpacity
                onPress={() => selectQuickRange('last7')}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-slate-50 items-center active:bg-slate-100">
                <Text className="text-[11px] font-semibold text-slate-700">Last 7D</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => selectQuickRange('last14')}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-slate-50 items-center active:bg-slate-100">
                <Text className="text-[11px] font-semibold text-slate-700">Last 14D</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => selectQuickRange('last30')}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-slate-50 items-center active:bg-slate-100">
                <Text className="text-[11px] font-semibold text-slate-700">Last 30D</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => selectQuickRange('thisMonth')}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-slate-50 items-center active:bg-slate-100">
                <Text className="text-[11px] font-semibold text-slate-700">This Month</Text>
              </TouchableOpacity>
            </View>

            {/* Inline Custom Calendar Card */}
            <View className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 mb-3">
              {/* Month Navigator Header */}
              <View className="flex-row items-center justify-between mb-2 px-1">
                <TouchableOpacity
                  onPress={handlePrevCalMonth}
                  className="h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 active:bg-slate-50">
                  <Ionicons name="chevron-back" size={16} color="#1E293B" />
                </TouchableOpacity>

                <Text className="font-bold text-sm text-slate-900">
                  {MONTH_NAMES[calMonth]} {calYear}
                </Text>

                <TouchableOpacity
                  onPress={handleNextCalMonth}
                  disabled={isCurrentOrFutureMonth}
                  style={{ opacity: isCurrentOrFutureMonth ? 0.35 : 1 }}
                  className="h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 active:bg-slate-50">
                  <Ionicons name="chevron-forward" size={16} color="#1E293B" />
                </TouchableOpacity>
              </View>

              {/* Weekday Names */}
              <View className="flex-row justify-around mb-1">
                {WEEK_DAYS.map((wd, i) => (
                  <View key={i} style={{ width: 36, alignItems: 'center' }}>
                    <Text
                      style={{ color: i === 0 ? '#F6163C' : '#94A3B8' }}
                      className="font-semibold text-[11px]">
                      {wd}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Day Grid */}
              <View className="flex-row flex-wrap justify-around">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <View key={`empty-${idx}`} style={{ width: 36, height: 34, marginVertical: 2 }} />;
                  }

                  const mStr = String(calMonth + 1).padStart(2, '0');
                  const dStr = String(day).padStart(2, '0');
                  const cellDate = `${calYear}-${mStr}-${dStr}`;

                  const todayStr = formatDateToYMD(new Date());
                  const isFuture = cellDate > todayStr;
                  const isStart = cellDate === tempStartDate;
                  const isEnd = cellDate === tempEndDate;
                  const inRange =
                    Boolean(tempStartDate && tempEndDate && cellDate > tempStartDate && cellDate < tempEndDate);
                  const isSelected = isStart || isEnd;
                  const isToday = cellDate === todayStr;
                  const isBeforeStartInToMode = Boolean(
                    activeDateStep === 'to' && tempStartDate && cellDate < tempStartDate
                  );

                  return (
                    <TouchableOpacity
                      key={`d-${day}`}
                      disabled={isFuture}
                      activeOpacity={isFuture ? 1 : 0.7}
                      onPress={() => !isFuture && handleSelectDay(day)}
                      style={{
                        width: 36,
                        height: 34,
                        borderRadius: isSelected ? 17 : inRange ? 6 : 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginVertical: 2,
                        backgroundColor: isSelected
                          ? '#F6163C'
                          : inRange
                          ? '#FFE4E6'
                          : isToday
                          ? '#F1F5F9'
                          : 'transparent',
                        borderWidth: isToday && !isSelected ? 1 : 0,
                        borderColor: '#CBD5E1',
                        opacity: isFuture ? 0.3 : isBeforeStartInToMode ? 0.45 : 1,
                      }}>
                      <Text
                        style={{
                          color: isSelected
                            ? '#FFFFFF'
                            : inRange
                            ? '#BE123C'
                            : isFuture
                            ? '#94A3B8'
                            : '#1E293B',
                          fontWeight: isSelected || inRange ? '700' : '500',
                        }}
                        className="text-xs">
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selected Date Range Pill */}
              <View className="mt-2.5 flex-row items-center justify-between rounded-xl bg-rose-50/70 border border-rose-200/60 px-3 py-2">
                <View className="flex-row items-center flex-1 pr-2">
                  <Ionicons name="calendar" size={14} color="#F6163C" />
                  <Text
                    numberOfLines={1}
                    className="font-bold text-xs text-rose-950 ml-2">
                    {tempStartDate && tempEndDate && tempStartDate !== tempEndDate
                      ? `${formatDisplayDate(tempStartDate)}  →  ${formatDisplayDate(tempEndDate)}`
                      : tempStartDate
                      ? formatDisplayDate(tempStartDate)
                      : 'Please select a date'}
                  </Text>
                </View>
                <View className="bg-white px-2 py-0.5 rounded-md border border-rose-200">
                  <Text className="font-bold text-[10px] text-[#F6163C]">
                    {tempStartDate && tempEndDate && tempStartDate !== tempEndDate
                      ? 'Range'
                      : tempStartDate
                      ? 'Single Day'
                      : 'Select'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Actions */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => {
                  setTempStartDate(null);
                  setTempEndDate(null);
                  setDateFilter('today');
                  setCustomStartDate(null);
                  setCustomEndDate(null);
                  setCurrentPage(1);
                  setShowDatePicker(false);
                }}
                className="flex-1 py-3.5 rounded-xl border border-slate-200 items-center">
                <Text className="font-semibold text-xs text-slate-600">Reset to Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={applyCustomDateFilter}
                disabled={!tempStartDate}
                style={{ opacity: tempStartDate ? 1 : 0.5 }}
                className="flex-1 py-3.5 rounded-xl bg-[#F6163C] items-center">
                <Text className="font-bold text-xs text-white">
                  {tempStartDate && tempEndDate && tempStartDate !== tempEndDate
                    ? `Apply (${formatShortDate(tempStartDate)} - ${formatShortDate(tempEndDate)})`
                    : tempStartDate
                    ? `Apply (${formatShortDate(tempStartDate)})`
                    : 'Apply Filter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </Container>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  jumpModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 28,
    alignSelf: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 15,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 15,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  sheetContent: {
    marginTop: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  profileMeta: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  checkIcon: {
    width: 18,
    height: 18,
    marginLeft: 6,
  },
  profileTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  detailsList: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footerBtns: {
    marginTop: 24,
  },
  primaryBtn: {
    backgroundColor: '#F6163C',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fixedPaginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 99,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navPageBtn: {
    height: 34,
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  navPageBtnDisabled: {
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    opacity: 0.35,
  },
  pageNumberBtn: {
    height: 34,
    minWidth: 34,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  pageNumberBtnActive: {
    borderColor: '#F6163C',
    backgroundColor: '#F6163C',
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  paginationInfoText: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
});

export default ViewAllScreen;
