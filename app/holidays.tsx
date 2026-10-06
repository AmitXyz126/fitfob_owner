import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Container } from '@/components/Container';
import Toast from 'react-native-toast-message';
import { useHolidays } from '@/hooks/useHolidays';
import { HolidayItemData } from '@/api/holidayApi';
import { CustomTimePickerModal } from '@/components/CustomTimePickerModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const QUICK_SUGGESTIONS = [
  'Gandhi Jayanti',
  'Diwali',
  'Holi',
  'Independence Day',
  'Republic Day',
  'Annual Maintenance',
  'New Year',
  'Christmas',
];

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

export default function HolidaysScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    holidays,
    isLoading,
    isRefetching,
    refetch,
    createHoliday,
    isCreating,
    deleteHoliday,
    isDeleting,
  } = useHolidays();

  // Create Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [closureType, setClosureType] = useState<'full_day' | 'partial_day'>('full_day');
  const [isRange, setIsRange] = useState(false);

  // Today as YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());

  // Calendar Navigation in Modal
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [selectingTarget, setSelectingTarget] = useState<'start' | 'end'>('start');

  // Time States (for partial closure)
  const [startTimeStr, setStartTimeStr] = useState('10:00:00.000');
  const [endTimeStr, setEndTimeStr] = useState('18:00:00.000');
  const [startTimeDisplay, setStartTimeDisplay] = useState('10:00 AM');
  const [endTimeDisplay, setEndTimeDisplay] = useState('06:00 PM');
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);

  // Tab Filter
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming'>('all');

  // Format YYYY-MM-DD to readable date
  const formatDisplayDate = (dStr?: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  const formatShortDate = (dStr?: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  // Convert HH:mm:ss or ISO or 12hr string to readable 12-hour display string
  const formatTimePayloadToDisplay = (timeVal?: string): string => {
    if (!timeVal) return '';
    const trimmed = String(timeVal).trim();
    if (/\b(AM|PM)\b/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }
    const match = trimmed.match(/(\d{1,2}):(\d{2})/);
    if (!match) return trimmed;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  // Parse date into badge pieces (Month, Day, Weekday)
  const getDateBadgeInfo = (dateStr?: string) => {
    if (!dateStr) return { month: '---', day: '--', weekday: '---' };
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return {
          month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
          day: String(d.getDate()).padStart(2, '0'),
          weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        };
      }
    } catch {}
    return { month: '---', day: '--', weekday: '---' };
  };

  // Check if date is upcoming or past
  const getDateStatus = (startD: string, endD: string) => {
    const today = getTodayStr();
    const targetEnd = endD || startD;
    if (targetEnd < today) return { label: 'Past', color: '#64748B', bg: '#F1F5F9' };
    if (startD <= today && targetEnd >= today)
      return { label: 'Today', color: '#059669', bg: '#ECFDF5' };
    return { label: 'Upcoming', color: '#F6163C', bg: '#FFF1F2' };
  };

  // Counts for each tab
  const tabCounts = useMemo(() => {
    const today = getTodayStr();
    let upcomingCount = 0;
    holidays.forEach((h) => {
      const targetEnd = h.endDate || h.startDate || '';
      if (targetEnd >= today) {
        upcomingCount++;
      }
    });
    return {
      all: holidays.length,
      upcoming: upcomingCount,
    };
  }, [holidays]);

  // Filtered & Chronologically Sorted Holidays
  const filteredHolidays = useMemo(() => {
    const today = getTodayStr();

    if (activeTab === 'upcoming') {
      return [...holidays]
        .filter((h) => (h.endDate || h.startDate || '') >= today)
        .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
    }
    // 'all' tab: upcoming first (nearest first), then past (recent first)
    return [...holidays].sort((a, b) => {
      const aEnd = a.endDate || a.startDate || '';
      const bEnd = b.endDate || b.startDate || '';
      const aIsUpcoming = aEnd >= today;
      const bIsUpcoming = bEnd >= today;
      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;
      if (aIsUpcoming && bIsUpcoming) return (a.startDate || '').localeCompare(b.startDate || '');
      return (b.startDate || '').localeCompare(a.startDate || '');
    });
  }, [holidays, activeTab]);

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

  // Check if current calendar month is current month or in the past
  const isCurrentMonthOrPast = useMemo(() => {
    const now = new Date();
    return calYear < now.getFullYear() || (calYear === now.getFullYear() && calMonth <= now.getMonth());
  }, [calYear, calMonth]);

  const handlePrevCalMonth = () => {
    if (isCurrentMonthOrPast) return;
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  // Helper to convert time string to minutes from midnight for safe comparison
  const extractTimeNumber = (tStr?: string): number => {
    if (!tStr) return 0;
    const trimmed = String(tStr).trim();
    const match = trimmed.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (/pm/i.test(trimmed) && h < 12) h += 12;
    if (/am/i.test(trimmed) && h === 12) h = 0;
    return h * 60 + m;
  };

  const getDefaultTimesForDate = (dateStr: string) => {
    const isToday = dateStr === getTodayStr();
    if (!isToday) {
      return {
        startPayload: '10:00:00.000',
        startDisplay: '10:00 AM',
        endPayload: '18:00:00.000',
        endDisplay: '06:00 PM',
      };
    }
    const now = new Date();
    const curH = now.getHours();
    const curM = now.getMinutes();

    // Round up to nearest upcoming 15-minute slot
    let startH = curH;
    let startM = Math.ceil(curM / 15) * 15;
    if (startM >= 60) {
      startH += 1;
      startM = 0;
    }
    if (startH >= 23 && startM > 45) {
      startH = 23;
      startM = 45;
    }
    let endH = Math.min(23, startH + 2);
    let endM = startM;
    if (endH <= startH) {
      endH = 23;
      endM = 55;
    }

    const formatPayload = (h: number, m: number) =>
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000`;
    const formatDisplay = (h: number, m: number) => {
      const dh = h % 12 || 12;
      const p = h >= 12 ? 'PM' : 'AM';
      return `${String(dh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
    };

    return {
      startPayload: formatPayload(startH, startM),
      startDisplay: formatDisplay(startH, startM),
      endPayload: formatPayload(endH, endM),
      endDisplay: formatDisplay(endH, endM),
    };
  };

  const handleSelectDay = (day: number) => {
    const m = String(calMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const pickedDate = `${calYear}-${m}-${d}`;
    const today = getTodayStr();

    // Prevent selecting dates in the past
    if (pickedDate < today) return;

    if (!isRange) {
      setStartDate(pickedDate);
      setEndDate(pickedDate);

      // If switching to today and current startTime is in the past, auto-adjust to upcoming hours
      if (pickedDate === today) {
        const curMin = new Date().getHours() * 60 + new Date().getMinutes();
        if (extractTimeNumber(startTimeStr) < curMin) {
          const defaults = getDefaultTimesForDate(pickedDate);
          setStartTimeStr(defaults.startPayload);
          setStartTimeDisplay(defaults.startDisplay);
          setEndTimeStr(defaults.endPayload);
          setEndTimeDisplay(defaults.endDisplay);
        }
      }
    } else {
      if (selectingTarget === 'start') {
        setStartDate(pickedDate);
        if (pickedDate > endDate) {
          setEndDate(pickedDate);
        }
        if (pickedDate === today) {
          const curMin = new Date().getHours() * 60 + new Date().getMinutes();
          if (extractTimeNumber(startTimeStr) < curMin) {
            const defaults = getDefaultTimesForDate(pickedDate);
            setStartTimeStr(defaults.startPayload);
            setStartTimeDisplay(defaults.startDisplay);
            setEndTimeStr(defaults.endPayload);
            setEndTimeDisplay(defaults.endDisplay);
          }
        }
        setSelectingTarget('end');
      } else {
        if (pickedDate < startDate) {
          setStartDate(pickedDate);
        } else {
          setEndDate(pickedDate);
        }
        setSelectingTarget('start');
      }
    }
  };

  const handleOpenCreateModal = () => {
    setTitle('');
    setTitleError('');
    setClosureType('full_day');
    setIsRange(false);
    const today = getTodayStr();
    setStartDate(today);
    setEndDate(today);
    const now = new Date();
    setCalMonth(now.getMonth());
    setCalYear(now.getFullYear());
    setSelectingTarget('start');

    // Default to clean upcoming hours if today
    const defaults = getDefaultTimesForDate(today);
    setStartTimeStr(defaults.startPayload);
    setEndTimeStr(defaults.endPayload);
    setStartTimeDisplay(defaults.startDisplay);
    setEndTimeDisplay(defaults.endDisplay);

    setTimePickerTarget(null);
    setModalVisible(true);
  };

  const getPickerMinDate = (): Date | undefined => {
    const isToday = startDate === getTodayStr();
    const now = new Date();

    if (timePickerTarget === 'start') {
      if (isToday) {
        return now;
      }
      return undefined;
    }

    if (timePickerTarget === 'end') {
      const startD = new Date();
      const match = startTimeStr.match(/^(\d{1,2}):(\d{2})/);
      if (match) {
        startD.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
      }
      if (isToday) {
        return startD > now ? startD : now;
      }
      return startD;
    }

    return undefined;
  };

  const getTimePickerInitialDate = () => {
    const targetStr = timePickerTarget === 'start' ? startTimeStr : endTimeStr;
    const isToday = startDate === getTodayStr();
    const d = new Date();

    if (targetStr) {
      const match = targetStr.match(/^(\d{1,2}):(\d{2})/);
      if (match) {
        d.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
      }
    }

    if (isToday) {
      const now = new Date();
      if (timePickerTarget === 'start' && d < now) {
        return now;
      }
      if (timePickerTarget === 'end') {
        const startD = new Date();
        const startMatch = startTimeStr.match(/^(\d{1,2}):(\d{2})/);
        if (startMatch) {
          startD.setHours(parseInt(startMatch[1], 10), parseInt(startMatch[2], 10), 0, 0);
        }
        const minEnd = startD > now ? startD : now;
        if (d < minEnd) {
          return minEnd;
        }
      }
    }
    return d;
  };

  const handleConfirmCustomTime = (selectedDate: Date) => {
    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    const isToday = startDate === getTodayStr();
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const selectedMin = hours * 60 + minutes;

    if (timePickerTarget === 'start') {
      // Prevent selecting past time for today
      if (isToday && selectedMin < currentMin) {
        Toast.show({
          type: 'error',
          text1: 'Past Time Not Allowed',
          text2: 'Closed From time cannot be in the past for today.',
          position: 'top',
        });
        return;
      }

      const strH = String(hours).padStart(2, '0');
      const strM = String(minutes).padStart(2, '0');
      const payloadTime = `${strH}:${strM}:00.000`;
      const displayH = hours % 12 || 12;
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayTime = `${String(displayH).padStart(2, '0')}:${strM} ${period}`;

      setStartTimeStr(payloadTime);
      setStartTimeDisplay(displayTime);

      // If current endTime is now earlier than or equal to the new startTime, push endTime forward
      const currentEndMin = extractTimeNumber(endTimeStr);
      if (currentEndMin <= selectedMin) {
        const nextEndMin = Math.min(23 * 60 + 55, selectedMin + 60); // 1 hour later
        const endH = Math.floor(nextEndMin / 60);
        const endM = nextEndMin % 60;
        const endPayload = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00.000`;
        const endDispH = endH % 12 || 12;
        const endPeriod = endH >= 12 ? 'PM' : 'AM';
        const endDisp = `${String(endDispH).padStart(2, '0')}:${String(endM).padStart(2, '0')} ${endPeriod}`;
        setEndTimeStr(endPayload);
        setEndTimeDisplay(endDisp);
      }
    } else if (timePickerTarget === 'end') {
      const startMin = extractTimeNumber(startTimeStr);
      if (selectedMin <= startMin) {
        Toast.show({
          type: 'error',
          text1: 'Invalid End Time',
          text2: 'Closed Until time must be later than Closed From time.',
          position: 'top',
        });
        return;
      }
      if (isToday && selectedMin < currentMin) {
        Toast.show({
          type: 'error',
          text1: 'Past Time Not Allowed',
          text2: 'Closed Until time cannot be in the past for today.',
          position: 'top',
        });
        return;
      }

      const strH = String(hours).padStart(2, '0');
      const strM = String(minutes).padStart(2, '0');
      const payloadTime = `${strH}:${strM}:00.000`;
      const displayH = hours % 12 || 12;
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayTime = `${String(displayH).padStart(2, '0')}:${strM} ${period}`;

      setEndTimeStr(payloadTime);
      setEndTimeDisplay(displayTime);
    }
    setTimePickerTarget(null);
  };

  const handleSaveHoliday = async () => {
    if (!title.trim()) {
      setTitleError('Holiday title is required');
      Toast.show({
        type: 'error',
        text1: 'Title Required',
        text2: 'Please enter a title for the holiday or closure.',
        position: 'top',
      });
      return;
    }

    const finalEndDate = isRange ? endDate : startDate;
    if (finalEndDate < startDate) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Date Range',
        text2: 'End date cannot be earlier than start date.',
        position: 'top',
      });
      return;
    }

    const isCurrentPartial = closureType === 'partial_day' || (closureType as string) === 'partial';

    if (isCurrentPartial && startTimeStr >= endTimeStr) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Closure Hours',
        text2: 'Closed Until time must be later than Closed From time.',
        position: 'top',
      });
      return;
    }

    // Validation: prevent saving a past time for today
    const isTodayHoliday = startDate === getTodayStr();
    if (isCurrentPartial && isTodayHoliday) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const startMin = extractTimeNumber(startTimeStr);
      if (startMin < nowMin) {
        Toast.show({
          type: 'error',
          text1: 'Start Time in Past',
          text2: 'Closed From time cannot be in the past for today.',
          position: 'top',
        });
        return;
      }
    }

    // Check for duplicate or conflicting holidays on the same date/time
    for (const existing of holidays) {
      const exStart = existing.startDate || '';
      const exEnd = existing.endDate || existing.startDate || '';
      if (!exStart) continue;

      // Check date range overlap: [startDate, finalEndDate] and [exStart, exEnd]
      const datesOverlap = startDate <= exEnd && finalEndDate >= exStart;
      if (!datesOverlap) continue;

      const isExistingPartial =
        existing.closureType === 'partial_day' || existing.closureType === 'partial';
      const isExistingFullDay = !isExistingPartial;

      // 1. Conflict: Existing holiday is Full Day
      if (isExistingFullDay) {
        Toast.show({
          type: 'error',
          text1: 'Holiday Already Scheduled',
          text2: `A full-day holiday ("${existing.title}") is already scheduled for this date.`,
          position: 'top',
        });
        return;
      }

      // 2. Conflict: New holiday is Full Day but a partial closure exists
      if (!isCurrentPartial && isExistingPartial) {
        Toast.show({
          type: 'error',
          text1: 'Schedule Conflict',
          text2: `A closure ("${existing.title}") is already scheduled for this date.`,
          position: 'top',
        });
        return;
      }

      // 3. Conflict: Both are Partial Day closures -> check hours overlap
      if (isCurrentPartial && isExistingPartial) {
        const newStartMin = extractTimeNumber(startTimeStr);
        const newEndMin = extractTimeNumber(endTimeStr);
        const exStartMin = extractTimeNumber(existing.startTime || '00:00:00.000');
        const exEndMin = extractTimeNumber(existing.endtime || existing.endTime || '23:59:59.000');

        const timeOverlaps = newStartMin < exEndMin && newEndMin > exStartMin;
        if (timeOverlaps) {
          const exStartDisp = formatTimePayloadToDisplay(existing.startTime) || 'custom hours';
          const exEndDisp = formatTimePayloadToDisplay(existing.endtime || existing.endTime) || '';
          Toast.show({
            type: 'error',
            text1: 'Time Slot Already Scheduled',
            text2: `A closure ("${existing.title}") is already scheduled (${exStartDisp} - ${exEndDisp}).`,
            position: 'top',
          });
          return;
        }
      }
    }

    try {
      const isFull = closureType === 'full_day';
      const payload: any = {
        title: title.trim(),
        closureType: isFull ? 'full_day' : 'partial_day',
        startDate: startDate,
        endDate: finalEndDate,
      };

      // Only attach time for partial closures; for full day, NO time is sent so club stays closed all day
      if (!isFull) {
        payload.startTime = startTimeStr;
        payload.endtime = endTimeStr;
        payload.endTime = endTimeStr;
      }

      await createHoliday(payload);

      setModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Holiday Created! 🎉',
        text2: `${title.trim()} added to club schedule.`,
      });

      refetch();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Save Holiday',
        text2: err?.response?.data?.message || err?.message || 'Something went wrong.',
        position: 'top',
      });
    }
  };

  const handleDelete = (holiday: HolidayItemData) => {
    Alert.alert(
      'Delete Holiday',
      `Are you sure you want to remove "${holiday.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHoliday(holiday);
              Toast.show({
                type: 'success',
                text1: 'Holiday Deleted',
                text2: `"${holiday.title}" has been removed.`,
              });
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: err?.message || 'Unable to delete holiday.',
              });
            }
          },
        },
      ]
    );
  };

  const renderHolidayCard = ({ item }: { item: HolidayItemData }) => {
    const isPartial = item.closureType === 'partial_day' || item.closureType === 'partial';
    const isFullDay = !isPartial;
    const status = getDateStatus(item.startDate, item.endDate);
    const isSingleDay = !item.endDate || item.endDate === item.startDate;
    const startBadge = getDateBadgeInfo(item.startDate);
    const isUpcoming = status.label === 'Upcoming';
    const isToday = status.label === 'Today';
    const startOffTime = formatTimePayloadToDisplay(item.startTime) || '10:00 AM';
    const endOffTime = formatTimePayloadToDisplay(item.endtime || item.endTime) || '06:00 PM';

    return (
      <View
        style={{
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
        className="mb-3 rounded-2xl border border-[#E2E8F0] bg-white p-3.5">
        <View className="flex-row items-center">
          {/* Left Date Block */}
          <View
            style={{
              backgroundColor: isToday ? '#ECFDF5' : isUpcoming ? '#FFF1F2' : '#F8FAFC',
              borderColor: isToday ? '#A7F3D0' : isUpcoming ? '#FECDD3' : '#E2E8F0',
            }}
            className="w-14 items-center justify-center rounded-xl border py-2 mr-3">
            <Text
              style={{
                color: isToday ? '#059669' : isUpcoming ? '#F6163C' : '#64748B',
                fontWeight: '800',
              }}
              className="font-bold text-[11px] tracking-wider uppercase">
              {startBadge.month}
            </Text>
            <Text
              style={{
                color: isToday ? '#065F46' : isUpcoming ? '#991B1B' : '#1E293B',
                fontWeight: '800',
              }}
              className="font-bold text-[20px] leading-tight my-0.5">
              {startBadge.day}
            </Text>
            <Text
              style={{ fontWeight: '700' }}
              className="font-semibold text-[11px] text-slate-500">
              {startBadge.weekday}
            </Text>
          </View>

          {/* Middle Info Block */}
          <View className="flex-1 justify-between">
            {/* Top row: Title + Status Pill */}
            <View className="flex-row items-start justify-between">
              <Text
                numberOfLines={1}
                style={{ fontWeight: '700' }}
                className="font-bold text-[15px] text-slate-900 leading-tight flex-1 mr-2">
                {item.title}
              </Text>

              {/* Status Badge with Live Dot */}
              <View
                style={{
                  backgroundColor: status.bg,
                  borderColor: isToday ? '#A7F3D0' : isUpcoming ? '#FECDD3' : '#E2E8F0',
                }}
                className="flex-row items-center px-2 py-0.5 rounded-full border">
                <View
                  style={{ backgroundColor: status.color }}
                  className="h-1.5 w-1.5 rounded-full mr-1"
                />
                <Text
                  style={{ color: status.color, fontWeight: '700' }}
                  className="font-bold text-[11px]">
                  {status.label}
                </Text>
              </View>
            </View>

            {/* Date Subtitle */}
            <Text
              style={{ fontWeight: '600' }}
              className="font-semibold text-[12px] text-slate-500 mt-0.5">
              {isSingleDay
                ? `${formatShortDate(item.startDate)} (${startBadge.weekday})`
                : `${formatShortDate(item.startDate)} → ${formatShortDate(item.endDate)}`}
            </Text>

            {/* Clear Off Hours Timing if Partial Closure */}
            {!isFullDay && (
              <View className="flex-row items-center mt-1.5 bg-[#FFF7ED] border border-[#FED7AA] px-2 py-0.5 rounded-lg self-start">
                <Ionicons name="time" size={12} color="#EA580C" />
                <Text
                  style={{ fontWeight: '700' }}
                  className="font-bold text-[11px] text-[#C2410C] ml-1">
                  Off: {startOffTime} - {endOffTime}
                </Text>
              </View>
            )}

            {/* Bottom Row: Tags & Delete Action */}
            <View className="flex-row items-center justify-between mt-2 pt-1 border-t border-slate-100">
              <View className="flex-row items-center flex-wrap gap-1.5 flex-1 pr-2">
                {/* Closure Type Pill */}
                <View
                  style={{
                    backgroundColor: isFullDay ? '#FEF2F2' : '#FFF7ED',
                    borderColor: isFullDay ? '#FEE2E2' : '#FFEDD5',
                  }}
                  className="flex-row items-center px-2 py-0.5 rounded-md border">
                  <Ionicons
                    name={isFullDay ? 'lock-closed' : 'time'}
                    size={10}
                    color={isFullDay ? '#DC2626' : '#EA580C'}
                  />
                  <Text
                    style={{ color: isFullDay ? '#DC2626' : '#EA580C', fontWeight: '700' }}
                    className="font-bold text-[11px] ml-1">
                    {isFullDay ? 'Full Day Closed' : 'Partial Closure'}
                  </Text>
                </View>

                {/* Multi-Day Badge */}
                {!isSingleDay && (
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <Ionicons name="calendar-outline" size={10} color="#64748B" />
                    <Text
                      style={{ fontWeight: '700' }}
                      className="font-bold text-[11px] text-slate-700 ml-1">
                      Multi-Day
                    </Text>
                  </View>
                )}
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                disabled={isDeleting}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="h-7 w-7 items-center justify-center rounded-lg bg-red-50 border border-red-100 active:bg-red-100">
                <Ionicons name="trash-outline" size={13} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Container>
      {/* Screen Header */}
      <View className="flex-row items-center justify-between py-2.5 mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200">
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>

        <View className="items-center flex-1">
          <Text
            style={{ fontWeight: '800' }}
            className="font-bold text-[18px] text-slate-900">
            Club Holidays
          </Text>
          <Text
            style={{ fontWeight: '600' }}
            className="font-semibold text-[11px] text-slate-400 mt-0.5">
            {tabCounts.all} {tabCounts.all === 1 ? 'Schedule' : 'Schedules'} Configured
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenCreateModal}
          activeOpacity={0.85}
          className="flex-row items-center bg-[#F6163C] px-3 py-1.5 rounded-xl shadow-sm">
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text
            style={{ fontWeight: '700' }}
            className="font-bold text-[13px] text-white ml-1">
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs with Dynamic Counters */}
      <View className="flex-row items-center bg-[#F1F5F9] p-1.5 rounded-2xl mb-3.5 border border-[#E2E8F0]">
        {(['all', 'upcoming'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'all' ? 'All' : 'Upcoming';
          const count = tabCounts[tab];
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: 12,
                backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                shadowColor: isActive ? '#0F172A' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isActive ? 0.08 : 0,
                shadowRadius: 3,
                elevation: isActive ? 2 : 0,
              }}
              className="flex-row items-center justify-center">
              <Text
                style={{
                  color: isActive ? '#0F172A' : '#64748B',
                  fontWeight: isActive ? '800' : '700',
                  fontSize: 13,
                }}
                className="font-bold">
                {label}
              </Text>
              <View
                style={{
                  backgroundColor: isActive ? '#FFF0F2' : '#E2E8F0',
                  marginLeft: 5,
                  paddingHorizontal: 6,
                  paddingVertical: 1.5,
                  borderRadius: 8,
                }}>
                <Text
                  style={{
                    color: isActive ? '#F6163C' : '#64748B',
                    fontWeight: '800',
                    fontSize: 11,
                  }}
                  className="font-bold">
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#F6163C" />
          <Text
            style={{ fontWeight: '600' }}
            className="font-semibold text-sm text-slate-400 mt-3">
            Loading club holidays...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHolidays}
          renderItem={renderHolidayCard}
          keyExtractor={(item) => String(item.documentId || item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 40,
            flexGrow: filteredHolidays.length === 0 ? 1 : undefined,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#F6163C']}
              tintColor="#F6163C"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16 px-6">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF0F2] mb-3.5 border border-[#FECDD3]">
                <Ionicons
                  name="calendar-outline"
                  size={30}
                  color="#F6163C"
                />
              </View>
              <Text
                style={{ fontWeight: '700' }}
                className="font-bold text-base text-slate-800 text-center mb-1">
                {activeTab === 'upcoming'
                  ? 'No Upcoming Holidays'
                  : 'No Holidays Found'}
              </Text>
              <Text
                style={{ fontWeight: '600' }}
                className="font-semibold text-xs text-slate-400 text-center leading-5 mb-5 max-w-[280px]">
                {activeTab === 'upcoming'
                  ? 'Your club has no upcoming closures scheduled.'
                  : 'Add official holidays or maintenance closures so members stay updated.'}
              </Text>
              <TouchableOpacity
                onPress={handleOpenCreateModal}
                activeOpacity={0.85}
                className="flex-row items-center bg-[#F6163C] px-5 py-3 rounded-2xl shadow-sm">
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text
                  style={{ fontWeight: '700' }}
                  className="font-bold text-sm text-white ml-2">
                  Add New Holiday
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ========================================================================= */}
      {/* CREATE HOLIDAY BOTTOM SHEET MODAL (Single, Beautiful, Unified)             */}
      {/* ========================================================================= */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => {
          Keyboard.dismiss();
          setModalVisible(false);
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              justifyContent: 'flex-end',
              paddingTop: Math.max(insets.top, 20) + 8,
            }}>
            {/* Backdrop Dismiss Area */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                Keyboard.dismiss();
                setModalVisible(false);
              }}
              style={StyleSheet.absoluteFill}
            />

            {/* Bottom Sheet Card */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: '100%',
                flexShrink: 1,
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: Math.max(insets.bottom, 16) + 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.18,
                shadowRadius: 16,
                elevation: 25,
              }}>
              {/* Grabber */}
              <View
                style={{
                  width: 44,
                  height: 4.5,
                  borderRadius: 3,
                  backgroundColor: '#E2E8F0',
                  alignSelf: 'center',
                  marginBottom: 12,
                }}
              />

              {/* Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#FFF0F2] mr-2.5">
                    <Ionicons name="calendar" size={18} color="#F6163C" />
                  </View>
                  <Text className="font-bold text-[15px] text-[#0F172A]">
                    Add Club Holiday
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setModalVisible(false);
                  }}
                  className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flexShrink: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingBottom: 24 }}>
                {/* 1. Title Input */}
                <View className="mb-3.5">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-bold text-[12px] text-[#334155]">
                      Holiday / Occasion Title <Text className="text-[#F6163C]">*</Text>
                    </Text>
                    {titleError ? (
                      <Text className="font-semibold text-[10px] text-[#EF4444]">
                        {titleError}
                      </Text>
                    ) : null}
                  </View>
                  <TextInput
                    value={title}
                    onChangeText={(val) => {
                      setTitle(val);
                      if (titleError) setTitleError('');
                    }}
                    placeholder="e.g. Gandhi Jayanti"
                    placeholderTextColor="#94A3B8"
                    className={`rounded-xl border bg-white px-3 py-2 text-[13px] text-[#0F172A] ${
                      titleError ? 'border-[#EF4444] bg-[#FEF2F2]' : 'border-[#CBD5E1]'
                    }`}
                  />

                  {/* Suggestions chips */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-1.5 flex-row">
                    {QUICK_SUGGESTIONS.map((sug) => (
                      <TouchableOpacity
                        key={sug}
                        onPress={() => {
                          Keyboard.dismiss();
                          setTitle(sug);
                          if (titleError) setTitleError('');
                        }}
                        className="mr-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-0.5 active:bg-[#FFF0F2]">
                        <Text className="text-[10px] font-semibold text-[#475569]">
                          {sug}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* 2. Closure Type Switcher */}
                <View className="mb-3.5">
                  <Text className="font-bold text-[12px] text-[#334155] mb-1.5">
                    Closure Type
                  </Text>
                  <View className="flex-row gap-2.5">
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setClosureType('full_day');
                      }}
                      style={{
                        borderColor: closureType === 'full_day' ? '#F6163C' : '#E2E8F0',
                        backgroundColor: closureType === 'full_day' ? '#FFF5F5' : '#FFFFFF',
                      }}
                      className="flex-1 rounded-xl border-2 p-2.5 items-center">
                      <Ionicons
                        name="lock-closed"
                        size={17}
                        color={closureType === 'full_day' ? '#F6163C' : '#64748B'}
                      />
                      <Text
                        style={{
                          color: closureType === 'full_day' ? '#F6163C' : '#334155',
                        }}
                        className="font-bold text-[12px] mt-0.5">
                        Full Day
                      </Text>
                      <Text className="text-[9.5px] text-slate-400 text-center mt-0.5">
                        Club closed all day
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setClosureType('partial_day');
                        if (startDate === getTodayStr()) {
                          const curMin = new Date().getHours() * 60 + new Date().getMinutes();
                          if (extractTimeNumber(startTimeStr) < curMin) {
                            const defaults = getDefaultTimesForDate(startDate);
                            setStartTimeStr(defaults.startPayload);
                            setStartTimeDisplay(defaults.startDisplay);
                            setEndTimeStr(defaults.endPayload);
                            setEndTimeDisplay(defaults.endDisplay);
                          }
                        }
                      }}
                      style={{
                        borderColor:
                          closureType === 'partial_day' || (closureType as string) === 'partial'
                            ? '#F6163C'
                            : '#E2E8F0',
                        backgroundColor:
                          closureType === 'partial_day' || (closureType as string) === 'partial'
                            ? '#FFF5F5'
                            : '#FFFFFF',
                      }}
                      className="flex-1 rounded-xl border-2 p-2.5 items-center">
                      <Ionicons
                        name="time"
                        size={17}
                        color={
                          closureType === 'partial_day' || (closureType as string) === 'partial'
                            ? '#F6163C'
                            : '#64748B'
                        }
                      />
                      <Text
                        style={{
                          color:
                            closureType === 'partial_day' || (closureType as string) === 'partial'
                              ? '#F6163C'
                              : '#334155',
                        }}
                        className="font-bold text-[12px] mt-0.5">
                        Partial Hours
                      </Text>
                      <Text className="text-[9.5px] text-slate-400 text-center mt-0.5">
                        Closed during specific hours
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3. Date Selection & Inline Calendar */}
                <View className="mb-3.5">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="font-bold text-[12px] text-[#334155]">
                      {isRange ? 'Holiday Date Range' : 'Holiday Date'}
                    </Text>

                    {/* Multi-day toggle */}
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setIsRange(!isRange);
                        if (!isRange) {
                          setEndDate(startDate);
                          setSelectingTarget('end');
                        }
                      }}
                      className="flex-row items-center bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-full">
                      <Ionicons
                        name={isRange ? 'checkbox' : 'square-outline'}
                        size={14}
                        color="#F6163C"
                      />
                      <Text className="font-semibold text-[10.5px] text-[#F6163C] ml-1">
                        Multiple Days?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Range target indicator if multiple days */}
                  {isRange && (
                    <View className="flex-row gap-2 mb-2">
                      <TouchableOpacity
                        onPress={() => setSelectingTarget('start')}
                        style={{
                          borderColor: selectingTarget === 'start' ? '#F6163C' : '#CBD5E1',
                          backgroundColor: selectingTarget === 'start' ? '#FFF1F2' : '#FFFFFF',
                        }}
                        className="flex-1 rounded-xl border p-2 flex-row items-center justify-between">
                        <View>
                          <Text className="text-[9.5px] font-semibold text-slate-400 uppercase">
                            Start Date
                          </Text>
                          <Text className="font-bold text-[11.5px] text-[#0F172A] mt-0.5">
                            {startDate}
                          </Text>
                        </View>
                        {selectingTarget === 'start' && (
                          <View className="h-2 w-2 rounded-full bg-[#F6163C]" />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setSelectingTarget('end')}
                        style={{
                          borderColor: selectingTarget === 'end' ? '#F6163C' : '#CBD5E1',
                          backgroundColor: selectingTarget === 'end' ? '#FFF1F2' : '#FFFFFF',
                        }}
                        className="flex-1 rounded-xl border p-2 flex-row items-center justify-between">
                        <View>
                          <Text className="text-[9.5px] font-semibold text-slate-400 uppercase">
                            End Date
                          </Text>
                          <Text className="font-bold text-[11.5px] text-[#0F172A] mt-0.5">
                            {endDate}
                          </Text>
                        </View>
                        {selectingTarget === 'end' && (
                          <View className="h-2 w-2 rounded-full bg-[#F6163C]" />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Inline Calendar Card */}
                  <View className="rounded-2xl border border-[#E2E8F0] bg-[#FAFAFA] p-2.5 shadow-xs">
                    {/* Month Navigator Header */}
                    <View className="flex-row items-center justify-between mb-2 px-1">
                      <TouchableOpacity
                        onPress={handlePrevCalMonth}
                        disabled={isCurrentMonthOrPast}
                        style={{ opacity: isCurrentMonthOrPast ? 0.35 : 1 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="h-7 w-7 items-center justify-center rounded-lg bg-white border border-[#E2E8F0] active:bg-slate-50">
                        <Ionicons name="chevron-back" size={15} color="#1E293B" />
                      </TouchableOpacity>

                      <Text className="font-bold text-[13.5px] text-[#0F172A]">
                        {MONTH_NAMES[calMonth]} {calYear}
                      </Text>

                      <TouchableOpacity
                        onPress={handleNextCalMonth}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="h-7 w-7 items-center justify-center rounded-lg bg-white border border-[#E2E8F0] active:bg-slate-50">
                        <Ionicons name="chevron-forward" size={15} color="#1E293B" />
                      </TouchableOpacity>
                    </View>

                    {/* Weekday Names */}
                    <View className="flex-row justify-around mb-1">
                      {WEEK_DAYS.map((wd, i) => (
                        <View key={i} style={{ width: 34, alignItems: 'center' }}>
                          <Text
                            style={{ color: i === 0 ? '#F6163C' : '#94A3B8' }}
                            className="font-semibold text-[10px]">
                            {wd}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Day Grid */}
                    <View className="flex-row flex-wrap justify-around">
                      {calendarDays.map((day, idx) => {
                        if (day === null) {
                          return <View key={`empty-${idx}`} style={{ width: 34, height: 32, marginVertical: 2 }} />;
                        }

                        const mStr = String(calMonth + 1).padStart(2, '0');
                        const dStr = String(day).padStart(2, '0');
                        const cellDate = `${calYear}-${mStr}-${dStr}`;

                        const today = getTodayStr();
                        const isPast = cellDate < today;
                        const isStart = cellDate === startDate;
                        const isEnd = cellDate === endDate;
                        const inRange = isRange && cellDate > startDate && cellDate < endDate;
                        const isSelected = isStart || isEnd;
                        const isToday = cellDate === today;

                        return (
                          <TouchableOpacity
                            key={`d-${day}`}
                            disabled={isPast}
                            activeOpacity={isPast ? 1 : 0.7}
                            onPress={() => !isPast && handleSelectDay(day)}
                            style={{
                              width: 34,
                              height: 32,
                              borderRadius: isSelected ? 16 : inRange ? 6 : 16,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginVertical: 2,
                              backgroundColor: isSelected
                                ? '#F6163C'
                                : inRange
                                ? '#FFE4E6'
                                : isToday
                                ? '#FFF1F2'
                                : 'transparent',
                              borderWidth: isToday && !isSelected ? 1 : 0,
                              borderColor: '#F6163C',
                              opacity: isPast ? 0.3 : 1,
                            }}>
                            <Text
                              style={{
                                color: isSelected
                                  ? '#FFFFFF'
                                  : inRange
                                  ? '#BE123C'
                                  : isToday
                                  ? '#F6163C'
                                  : isPast
                                  ? '#94A3B8'
                                  : '#1E293B',
                                fontWeight: isSelected || inRange || isToday ? '700' : '500',
                              }}
                              className="text-[12px]">
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Selected Date Summary Pill */}
                    <View className="mt-2 flex-row items-center justify-between rounded-xl bg-[#FFF5F5] border border-[#FECDD3] px-2.5 py-1.5">
                      <View className="flex-row items-center flex-1 pr-2">
                        <Ionicons name="calendar" size={13} color="#F6163C" />
                        <Text
                          numberOfLines={1}
                          className="font-bold text-[11.5px] text-[#991B1B] ml-1.5">
                          {isRange
                            ? `${formatShortDate(startDate)} → ${formatShortDate(endDate)}`
                            : formatDisplayDate(startDate)}
                        </Text>
                      </View>
                      <View className="bg-white px-2 py-0.5 rounded-md border border-[#FECDD3]">
                        <Text className="font-bold text-[9.5px] text-[#F6163C]">
                          {isRange ? `${endDate >= startDate ? 'Range' : 'Select End'}` : 'Single Day'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 4. Time Pickers (if partial closure) */}
                {(closureType === 'partial_day' || (closureType as string) === 'partial') && (
                  <View className="mb-3.5">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="font-bold text-[12px] text-[#334155]">
                        Closure Hours
                      </Text>
                      <Text className="text-[10px] font-semibold text-[#F6163C]">
                        Tap card to set custom time
                      </Text>
                    </View>

                    {/* Start Time & End Time Interactive Cards */}
                    <View className="flex-row gap-2">
                      {/* Closed From Touchable Card */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          Keyboard.dismiss();
                          setTimePickerTarget('start');
                        }}
                        className="flex-1 rounded-xl border border-[#CBD5E1] bg-[#FAFAFA] p-2 active:bg-slate-100">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                            Closed From
                          </Text>
                          <View className="h-4.5 w-4.5 rounded-full bg-[#FFF0F2] items-center justify-center">
                            <Ionicons name="pencil" size={9} color="#F6163C" />
                          </View>
                        </View>
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="time" size={14} color="#F6163C" />
                          <Text className="font-extrabold text-[13px] text-[#0F172A] ml-1.5">
                            {startTimeDisplay}
                          </Text>
                        </View>
                        <Text className="text-[9.5px] font-medium text-slate-400 mt-0.5">
                          Tap to set start time
                        </Text>
                      </TouchableOpacity>

                      {/* Closed Until Touchable Card */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          Keyboard.dismiss();
                          setTimePickerTarget('end');
                        }}
                        className="flex-1 rounded-xl border border-[#CBD5E1] bg-[#FAFAFA] p-2 active:bg-slate-100">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                            Closed Until
                          </Text>
                          <View className="h-4.5 w-4.5 rounded-full bg-[#FFF0F2] items-center justify-center">
                            <Ionicons name="pencil" size={9} color="#F6163C" />
                          </View>
                        </View>
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="time" size={14} color="#F6163C" />
                          <Text className="font-extrabold text-[13px] text-[#0F172A] ml-1.5">
                            {endTimeDisplay}
                          </Text>
                        </View>
                        <Text className="text-[9.5px] font-medium text-slate-400 mt-0.5">
                          Tap to set end time
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* 5. Submit Button */}
                <TouchableOpacity
                  onPress={handleSaveHoliday}
                  disabled={isCreating}
                  activeOpacity={0.85}
                  className="mt-1.5 flex-row items-center justify-center rounded-2xl bg-[#F6163C] py-3 shadow-md">
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
                      <Text className="font-bold text-[13.5px] text-white ml-2">
                        Save Holiday
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Custom Time Picker overlay within the Modal */}
        <CustomTimePickerModal
          visible={timePickerTarget !== null}
          initialDate={getTimePickerInitialDate()}
          minDate={getPickerMinDate()}
          title={timePickerTarget === 'start' ? 'Select Start Time (Closed From)' : 'Select End Time (Closed Until)'}
          useModal={false}
          onConfirm={handleConfirmCustomTime}
          onCancel={() => setTimePickerTarget(null)}
        />

        {/* In-Modal Toast to prevent displaying behind the Modal window */}
        <Toast />
      </Modal>
    </Container>
  );
}
