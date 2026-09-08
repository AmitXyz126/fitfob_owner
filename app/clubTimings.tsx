import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import GymLoader from '@/components/GymLoader';
import { useUserDetail, useClubOwnerMe } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomTimePickerModal } from '@/components/CustomTimePickerModal';
import Toast from 'react-native-toast-message';

const DAYS_CONFIG = [
  { key: 'monday', name: 'Monday' },
  { key: 'tuesday', name: 'Tuesday' },
  { key: 'wednesday', name: 'Wednesday' },
  { key: 'thursday', name: 'Thursday' },
  { key: 'friday', name: 'Friday' },
  { key: 'saturday', name: 'Saturday' },
  { key: 'sunday', name: 'Sunday' },
];

export default function ClubTimingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userKey = user?.id || user?.email || 'guest';
  const { profileStatus, updateClubOwner } = useUserDetail();
  const { data: myOwnerData } = useClubOwnerMe();
  const hasLoadedRef = useRef(false);

  // --- CLOCK ANIMATION VALUES ---
  const secondValue = useRef(new Animated.Value(0)).current;
  const minuteValue = useRef(new Animated.Value(0)).current;
  const hourValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(secondValue, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(minuteValue, {
        toValue: 1,
        duration: 120000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(hourValue, {
        toValue: 1,
        duration: 720000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [secondValue, minuteValue, hourValue]);

  const secondSpin = secondValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const minuteSpin = minuteValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['60deg', '420deg'],
  });
  const hourSpin = hourValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['300deg', '660deg'],
  });

  // --- TIME HELPERS ---
  const parseTimeStringToDate = (timeStr?: any, defaultHour: number = 6): Date => {
    const d = new Date();
    if (!timeStr) {
      d.setHours(defaultHour, 0, 0, 0);
      return d;
    }
    if (timeStr instanceof Date && !isNaN(timeStr.getTime())) {
      return new Date(timeStr.getTime());
    }

    const clean = String(timeStr).trim();

    // 1. "06:00 AM", "6:30 PM", "10:00:00 PM"
    const ampmMatch = clean.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      d.setHours(hours, minutes, 0, 0);
      return d;
    }

    // 2. ISO timestamp containing 'T': e.g. "2026-09-08T06:30:00" or Date string
    if (clean.includes('T')) {
      const parsedIso = new Date(clean);
      if (!isNaN(parsedIso.getTime())) {
        d.setHours(parsedIso.getHours(), parsedIso.getMinutes(), 0, 0);
        return d;
      }
      const isoTimeMatch = clean.match(/T(\d{1,2}):(\d{2})/);
      if (isoTimeMatch) {
        d.setHours(parseInt(isoTimeMatch[1], 10), parseInt(isoTimeMatch[2], 10), 0, 0);
        return d;
      }
    }

    // 3. 24-hour time format: "06:00", "06:00:00", "22:30", "7:45"
    const time24Match = clean.match(/^(\d{1,2}):(\d{2})/);
    if (time24Match) {
      const hours = parseInt(time24Match[1], 10);
      const minutes = parseInt(time24Match[2], 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        d.setHours(hours, minutes, 0, 0);
        return d;
      }
    }

    d.setHours(defaultHour, 0, 0, 0);
    return d;
  };

  const ensureDate = (val: any, defaultHour: number = 6): Date => {
    return parseTimeStringToDate(val, defaultHour);
  };

  const formatTime12h = (timeInput: any, defaultHour: number = 6): string => {
    const dateObj = ensureDate(timeInput, defaultHour);
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strHours = String(hours).padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
  };

  const formatTime24h = (timeInput: any, defaultHour: number = 6) => {
    if (typeof timeInput === 'string') {
      const clean = timeInput.trim();
      const time24Match = clean.match(/^(\d{1,2}):(\d{2})$/);
      if (time24Match) {
        const h = String(parseInt(time24Match[1], 10)).padStart(2, '0');
        return `${h}:${time24Match[2]}`;
      }
    }
    const dateObj = ensureDate(timeInput, defaultHour);
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTimeParts = (timeInput: any, defaultHour: number = 6) => {
    const dateObj = ensureDate(timeInput, defaultHour);
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strHours = hours < 10 ? `0${hours}` : hours;
    const strMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return { time: `${strHours}:${strMinutes}`, ampm };
  };

  // --- TIMING STATES ---
  const [isEverydayMode, setIsEverydayMode] = useState(true);
  const [everydayOpenTime, setEverydayOpenTime] = useState<Date>(() => ensureDate(undefined, 6));
  const [everydayCloseTime, setEverydayCloseTime] = useState<Date>(() => ensureDate(undefined, 22));

  const [daySchedules, setDaySchedules] = useState<
    Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }>
  >(() => {
    const initial: Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }> = {};
    DAYS_CONFIG.forEach(({ key }) => {
      initial[key] = {
        isOpen: true,
        openTime: ensureDate(undefined, 6),
        closeTime: ensureDate(undefined, 22),
      };
    });
    return initial;
  });

  const [activePicker, setActivePicker] = useState<{
    dayKey: string;
    type: 'openTime' | 'closeTime';
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- LOAD INITIAL DATA ---
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const loadData = async () => {
      let savedClubProfile: any = null;
      let savedStep3: any = null;
      let savedStep4: any = null;
      try {
        const json1 = await AsyncStorage.getItem('club_profile');
        if (json1) savedClubProfile = JSON.parse(json1);

        const keys = await AsyncStorage.getAllKeys();
        const pId = profileStatus?.id || profileStatus?.pendingClubOwnerId || user?.id || user?.email;
        const userSpecificStep3Key = pId ? `@onboarding_step3_data_${pId}` : null;

        let foundStep3Key = null;
        if (userSpecificStep3Key && keys.includes(userSpecificStep3Key)) {
          foundStep3Key = userSpecificStep3Key;
        } else {
          const step3Keys = keys.filter((k) => k.includes('onboarding_step3_data'));
          if (step3Keys.length > 0) {
            foundStep3Key = step3Keys[step3Keys.length - 1];
          }
        }

        if (foundStep3Key) {
          const json3 = await AsyncStorage.getItem(foundStep3Key);
          if (json3) savedStep3 = JSON.parse(json3);
        }

        const step4Key = keys.find((k) => k.includes('onboarding_step4_data'));
        if (step4Key) {
          const json4 = await AsyncStorage.getItem(step4Key);
          if (json4) savedStep4 = JSON.parse(json4);
        }
      } catch (e) {
        console.log('Error reading storage in clubTimings:', e);
      }

      // 1. If savedClubProfile already has local daySchedules, use that directly
      const preferredProfile = savedClubProfile?.daySchedules
        ? savedClubProfile
        : savedStep3?.daySchedules
        ? savedStep3
        : null;

      if (preferredProfile?.daySchedules) {
        const isEveryday = Boolean(preferredProfile.isEverydayMode);
        setIsEverydayMode(isEveryday);
        if (preferredProfile.everydayOpenTime) {
          setEverydayOpenTime(parseTimeStringToDate(preferredProfile.everydayOpenTime, 6));
        }
        if (preferredProfile.everydayCloseTime) {
          setEverydayCloseTime(parseTimeStringToDate(preferredProfile.everydayCloseTime, 22));
        }

        const restored: Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }> = {};
        DAYS_CONFIG.forEach(({ key }) => {
          const item = preferredProfile.daySchedules[key];
          if (item) {
            restored[key] = {
              isOpen: Boolean(item.isOpen),
              openTime: parseTimeStringToDate(item.openTime, 6),
              closeTime: parseTimeStringToDate(item.closeTime, 22),
            };
          } else {
            restored[key] = {
              isOpen: false,
              openTime: parseTimeStringToDate(undefined, 6),
              closeTime: parseTimeStringToDate(undefined, 22),
            };
          }
        });
        setDaySchedules(restored);
        hasLoadedRef.current = true;
        setIsLoaded(true);
        return;
      }

      const pData = profileStatus?.data || profileStatus || {};

      let scheduling: any =
        savedClubProfile?.weekdayScheduling ||
        savedStep3?.weekdayScheduling ||
        myOwnerData?.weekdayScheduling ||
        myOwnerData?.weekday_scheduling ||
        pData?.weekdayScheduling ||
        pData?.weekday_scheduling ||
        pData?.scheduling ||
        pData?.pendingClubOwner?.weekdayScheduling ||
        pData?.clubOwnerDetail?.weekdayScheduling ||
        savedStep4?.weekdayScheduling;

      if (typeof scheduling === 'string') {
        try {
          scheduling = JSON.parse(scheduling);
        } catch (e) {
          // ignore
        }
      }

      const rawOpen =
        savedClubProfile?.everydayOpenTime ||
        savedClubProfile?.openingTime ||
        savedStep3?.everydayOpenTime ||
        savedStep3?.openingTime ||
        myOwnerData?.openingTime ||
        myOwnerData?.opening_time ||
        pData?.openingTime ||
        pData?.opening_time ||
        pData?.pendingClubOwner?.openingTime ||
        pData?.clubOwnerDetail?.openingTime ||
        savedStep4?.openingTime;

      const rawClose =
        savedClubProfile?.everydayCloseTime ||
        savedClubProfile?.closingTime ||
        savedStep3?.everydayCloseTime ||
        savedStep3?.closingTime ||
        myOwnerData?.closingTime ||
        myOwnerData?.closing_time ||
        pData?.closingTime ||
        pData?.closing_time ||
        pData?.pendingClubOwner?.closingTime ||
        pData?.clubOwnerDetail?.closingTime ||
        savedStep4?.closingTime;

      if (scheduling && typeof scheduling === 'object') {
        if (scheduling.everyday) {
          setIsEverydayMode(true);
          const openD = parseTimeStringToDate(scheduling.everyday.openingTime, 6);
          const closeD = parseTimeStringToDate(scheduling.everyday.closingTime, 22);
          setEverydayOpenTime(openD);
          setEverydayCloseTime(closeD);

          const restored: Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }> = {};
          DAYS_CONFIG.forEach(({ key }) => {
            restored[key] = { isOpen: true, openTime: openD, closeTime: closeD };
          });
          setDaySchedules(restored);
        } else {
          // Check if all 7 days exist with same timings
          const presentDays = DAYS_CONFIG.filter(({ key }) => scheduling[key]);
          const all7DaysPresent = presentDays.length === 7;
          const firstDay = presentDays[0] ? scheduling[presentDays[0].key] : null;
          const isAllSameTiming =
            all7DaysPresent &&
            firstDay &&
            presentDays.every(
              ({ key }) =>
                scheduling[key]?.openingTime === firstDay.openingTime &&
                scheduling[key]?.closingTime === firstDay.closingTime
            );

          if (isAllSameTiming && firstDay) {
            setIsEverydayMode(true);
            const openD = parseTimeStringToDate(firstDay.openingTime, 6);
            const closeD = parseTimeStringToDate(firstDay.closingTime, 22);
            setEverydayOpenTime(openD);
            setEverydayCloseTime(closeD);
          } else {
            setIsEverydayMode(false);
            if (firstDay) {
              setEverydayOpenTime(parseTimeStringToDate(firstDay.openingTime, 6));
              setEverydayCloseTime(parseTimeStringToDate(firstDay.closingTime, 22));
            } else if (savedStep3?.everydayOpenTime) {
              setEverydayOpenTime(parseTimeStringToDate(savedStep3.everydayOpenTime, 6));
              setEverydayCloseTime(parseTimeStringToDate(savedStep3.everydayCloseTime, 22));
            }
          }

          const restored: Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }> = {};
          DAYS_CONFIG.forEach(({ key }) => {
            const dayData = scheduling[key];
            if (dayData) {
              restored[key] = {
                isOpen: true,
                openTime: parseTimeStringToDate(dayData.openingTime, 6),
                closeTime: parseTimeStringToDate(dayData.closingTime, 22),
              };
            } else {
              restored[key] = {
                isOpen: false,
                openTime: parseTimeStringToDate(undefined, 6),
                closeTime: parseTimeStringToDate(undefined, 22),
              };
            }
          });
          setDaySchedules(restored);
        }
      } else if (rawOpen || rawClose) {
        setIsEverydayMode(true);
        const openD = parseTimeStringToDate(rawOpen, 6);
        const closeD = parseTimeStringToDate(rawClose, 22);
        setEverydayOpenTime(openD);
        setEverydayCloseTime(closeD);

        const restored: Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }> = {};
        DAYS_CONFIG.forEach(({ key }) => {
          restored[key] = { isOpen: true, openTime: openD, closeTime: closeD };
        });
        setDaySchedules(restored);
      }

      hasLoadedRef.current = true;
      setIsLoaded(true);
    };

    loadData();
  }, [profileStatus, myOwnerData, user]);

  // Auto-persist timing changes immediately to local storage
  useEffect(() => {
    if (!isLoaded) return;
    const autoSaveDraft = async () => {
      try {
        let weekdaySchedulingPayload: any = {};
        const openTimeStr = formatTime12h(everydayOpenTime, 6);
        const closeTimeStr = formatTime12h(everydayCloseTime, 22);

        if (isEverydayMode) {
          weekdaySchedulingPayload = {
            everyday: {
              openingTime: openTimeStr,
              closingTime: closeTimeStr,
            },
          };
        } else {
          DAYS_CONFIG.forEach(({ key }) => {
            if (daySchedules[key]?.isOpen) {
              weekdaySchedulingPayload[key] = {
                openingTime: formatTime12h(daySchedules[key].openTime, 6),
                closingTime: formatTime12h(daySchedules[key].closeTime, 22),
              };
            }
          });
        }

        const serializedDaySchedules: Record<string, { isOpen: boolean; openTime: string; closeTime: string }> = {};
        DAYS_CONFIG.forEach(({ key }) => {
          const item = daySchedules[key];
          serializedDaySchedules[key] = {
            isOpen: isEverydayMode ? true : Boolean(item?.isOpen),
            openTime: formatTime12h(isEverydayMode ? everydayOpenTime : item?.openTime, 6),
            closeTime: formatTime12h(isEverydayMode ? everydayCloseTime : item?.closeTime, 22),
          };
        });

        const existing = await AsyncStorage.getItem('club_profile');
        const parsed = existing ? JSON.parse(existing) : {};
        const updated = {
          ...parsed,
          weekdayScheduling: weekdaySchedulingPayload,
          isEverydayMode,
          everydayOpenTime: openTimeStr,
          everydayCloseTime: closeTimeStr,
          openingTime: openTimeStr,
          closingTime: closeTimeStr,
          daySchedules: serializedDaySchedules,
        };
        await AsyncStorage.setItem('club_profile', JSON.stringify(updated));

        const keys = await AsyncStorage.getAllKeys();
        const pId = profileStatus?.id || profileStatus?.pendingClubOwnerId || user?.id || user?.email;
        const userSpecificStep3Key = pId ? `@onboarding_step3_data_${pId}` : null;
        const step3Keys = keys.filter((k) => k.includes('onboarding_step3_data'));
        const targetKeys = new Set<string>();
        if (userSpecificStep3Key) targetKeys.add(userSpecificStep3Key);
        step3Keys.forEach((k) => targetKeys.add(k));

        for (const key of targetKeys) {
          try {
            const raw3 = await AsyncStorage.getItem(key);
            const p3 = raw3 ? JSON.parse(raw3) : {};
            await AsyncStorage.setItem(
              key,
              JSON.stringify({
                ...p3,
                weekdayScheduling: weekdaySchedulingPayload,
                isEverydayMode,
                everydayOpenTime: openTimeStr,
                everydayCloseTime: closeTimeStr,
                openingTime: openTimeStr,
                closingTime: closeTimeStr,
                daySchedules: serializedDaySchedules,
              })
            );
          } catch {}
        }
      } catch (e) {
        console.log('Error auto-saving timing draft:', e);
      }
    };

    autoSaveDraft();
  }, [daySchedules, isEverydayMode, everydayOpenTime, everydayCloseTime, isLoaded]);

  // --- ACTIONS ---
  const toggleEverydayMode = (enabled: boolean) => {
    setIsEverydayMode(enabled);
    if (enabled) {
      // Sync all individual days with everyday open/close times
      setDaySchedules((prev) => {
        const next = { ...prev };
        DAYS_CONFIG.forEach(({ key }) => {
          next[key] = {
            isOpen: true,
            openTime: everydayOpenTime,
            closeTime: everydayCloseTime,
          };
        });
        return next;
      });
    }
  };

  const toggleDayOpen = (dayKey: string) => {
    if (isEverydayMode) {
      setIsEverydayMode(false);
      setDaySchedules((prev) => {
        const next: Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }> = {};
        DAYS_CONFIG.forEach(({ key }) => {
          next[key] = {
            isOpen: key === dayKey ? false : true,
            openTime: prev[key]?.openTime || everydayOpenTime,
            closeTime: prev[key]?.closeTime || everydayCloseTime,
          };
        });
        return next;
      });
      return;
    }

    setDaySchedules((prev) => {
      const current = prev[dayKey] || {
        isOpen: true,
        openTime: ensureDate(undefined, 6),
        closeTime: ensureDate(undefined, 22),
      };
      return {
        ...prev,
        [dayKey]: {
          ...current,
          isOpen: !current.isOpen,
        },
      };
    });
  };

  const onCustomTimeChange = (
    dayKey: string,
    type: 'openTime' | 'closeTime',
    selectedDate: Date
  ) => {
    if (dayKey === 'everyday') {
      if (type === 'openTime') {
        setEverydayOpenTime(selectedDate);
        setDaySchedules((prev) => {
          const next = { ...prev };
          DAYS_CONFIG.forEach(({ key }) => {
            if (next[key]) next[key] = { ...next[key], openTime: selectedDate };
          });
          return next;
        });
      } else {
        setEverydayCloseTime(selectedDate);
        setDaySchedules((prev) => {
          const next = { ...prev };
          DAYS_CONFIG.forEach(({ key }) => {
            if (next[key]) next[key] = { ...next[key], closeTime: selectedDate };
          });
          return next;
        });
      }
    } else {
      setDaySchedules((prev) => ({
        ...prev,
        [dayKey]: {
          ...(prev[dayKey] || {
            isOpen: true,
            openTime: ensureDate(undefined, 6),
            closeTime: ensureDate(undefined, 22),
          }),
          [type]: selectedDate,
        },
      }));
    }
  };

  // --- SAVE TIMINGS ---
  const handleSaveTimings = async () => {
    let weekdaySchedulingPayload: any = {};
    let openTimeStr = '';
    let closeTimeStr = '';
    let weekdayStr = 'Monday to Friday';
    let weekendStr = 'Saturday & Sunday';

    if (isEverydayMode) {
      openTimeStr = formatTime12h(everydayOpenTime, 6);
      closeTimeStr = formatTime12h(everydayCloseTime, 22);

      weekdaySchedulingPayload = {
        everyday: {
          openingTime: openTimeStr,
          closingTime: closeTimeStr,
        },
      };

      weekdayStr = 'Everyday';
      weekendStr = 'Everyday';
    } else {
      const activeDays = DAYS_CONFIG.filter(({ key }) => daySchedules[key]?.isOpen);
      if (activeDays.length === 0) {
        Alert.alert('Selection Error', 'Please enable at least one operating day for your club.');
        return;
      }

      activeDays.forEach(({ key }) => {
        weekdaySchedulingPayload[key] = {
          openingTime: formatTime12h(daySchedules[key].openTime, 6),
          closingTime: formatTime12h(daySchedules[key].closeTime, 22),
        };
      });

      const firstActive = activeDays[0];
      openTimeStr = formatTime12h(daySchedules[firstActive.key].openTime, 6);
      closeTimeStr = formatTime12h(daySchedules[firstActive.key].closeTime, 22);

      const isMonToFri =
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].every((d) => daySchedules[d]?.isOpen) &&
        !daySchedules.saturday?.isOpen &&
        !daySchedules.sunday?.isOpen;

      const isMonToSat =
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].every((d) => daySchedules[d]?.isOpen) &&
        !daySchedules.sunday?.isOpen;

      const isSatAndSun = daySchedules.saturday?.isOpen && daySchedules.sunday?.isOpen;
      const isSunOnly = !daySchedules.saturday?.isOpen && daySchedules.sunday?.isOpen;
      const isSatOnly = daySchedules.saturday?.isOpen && !daySchedules.sunday?.isOpen;

      if (isMonToFri) weekdayStr = 'Monday to Friday';
      else if (isMonToSat) weekdayStr = 'Monday to Saturday';
      else weekdayStr = `${activeDays.length} Days / Week`;

      if (isSatAndSun) weekendStr = 'Saturday & Sunday';
      else if (isSunOnly) weekendStr = 'Sunday Only';
      else if (isSatOnly) weekendStr = 'Saturday Only';
      else weekendStr = 'Closed';
    }

    const payload: any = {
      weekdayScheduling: weekdaySchedulingPayload,
    };

    setIsSaving(true);
    console.log('Sending timing payload from clubTimings:', payload);

    updateClubOwner.mutate(payload, {
      onSuccess: async () => {
        setIsSaving(false);
        try {
          const serializedDaySchedules: Record<string, { isOpen: boolean; openTime: string; closeTime: string }> = {};
          DAYS_CONFIG.forEach(({ key }) => {
            const item = daySchedules[key];
            serializedDaySchedules[key] = {
              isOpen: isEverydayMode ? true : Boolean(item?.isOpen),
              openTime: formatTime12h(isEverydayMode ? everydayOpenTime : item?.openTime, 6),
              closeTime: formatTime12h(isEverydayMode ? everydayCloseTime : item?.closeTime, 22),
            };
          });

          // Update AsyncStorage club_profile
          const existing = await AsyncStorage.getItem('club_profile');
          const parsed = existing ? JSON.parse(existing) : {};
          const updated = {
            ...parsed,
            weekdayScheduling: weekdaySchedulingPayload,
            isEverydayMode,
            everydayOpenTime: openTimeStr,
            everydayCloseTime: closeTimeStr,
            openingTime: openTimeStr,
            closingTime: closeTimeStr,
            daySchedules: serializedDaySchedules,
          };
          await AsyncStorage.setItem('club_profile', JSON.stringify(updated));

          // Also update cached club_owner_me in AsyncStorage
          const cachedOwnerMeStr = await AsyncStorage.getItem('club_owner_me');
          if (cachedOwnerMeStr) {
            try {
              const parsedOwnerMe = JSON.parse(cachedOwnerMeStr);
              await AsyncStorage.setItem(
                'club_owner_me',
                JSON.stringify({
                  ...parsedOwnerMe,
                  weekdayScheduling: weekdaySchedulingPayload,
                  openingTime: openTimeStr,
                  closingTime: closeTimeStr,
                })
              );
            } catch {}
          }

          // Immediately update React Query cache so previous screen (clubProfile) reflects new data synchronously
          queryClient.setQueryData(['my-club-owner-me', userKey], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              weekdayScheduling: weekdaySchedulingPayload,
              openingTime: openTimeStr,
              closingTime: closeTimeStr,
            };
          });
          queryClient.setQueryData(['club-owner-me', userKey], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              weekdayScheduling: weekdaySchedulingPayload,
              openingTime: openTimeStr,
              closingTime: closeTimeStr,
            };
          });

          // Invalidate queries in background
          queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
          queryClient.invalidateQueries({ queryKey: ['my-club-owner-me'] });

          // Also update draft steps if present
          const keys = await AsyncStorage.getAllKeys();
          const pId = profileStatus?.id || profileStatus?.pendingClubOwnerId || user?.id || user?.email;
          const userSpecificStep3Key = pId ? `@onboarding_step3_data_${pId}` : null;
          const step3Keys = keys.filter((k) => k.includes('onboarding_step3_data'));
          const targetKeys = new Set<string>();
          if (userSpecificStep3Key) targetKeys.add(userSpecificStep3Key);
          step3Keys.forEach((k) => targetKeys.add(k));

          for (const key of targetKeys) {
            try {
              const raw3 = await AsyncStorage.getItem(key);
              const p3 = raw3 ? JSON.parse(raw3) : {};
              await AsyncStorage.setItem(
                key,
                JSON.stringify({
                  ...p3,
                  weekdayScheduling: weekdaySchedulingPayload,
                  isEverydayMode,
                  everydayOpenTime: openTimeStr,
                  everydayCloseTime: closeTimeStr,
                  openingTime: openTimeStr,
                  closingTime: closeTimeStr,
                  daySchedules: serializedDaySchedules,
                })
              );
            } catch {
              // ignore per-key error
            }
          }
        } catch (e) {
          console.log('Error updating local storage in clubTimings:', e);
        }
        Toast.show({
          type: 'success',
          text1: 'Timings Updated! ⏰',
          text2: 'Club operating hours saved successfully.',
        });
        router.back();
      },
      onError: (err: any) => {
        setIsSaving(false);
        console.error('Error saving timings:', err);
      },
    });
  };

  const everydayOpenParts = formatTimeParts(everydayOpenTime, 6);
  const everydayCloseParts = formatTimeParts(everydayCloseTime, 22);

  const isEverydayOpenPickerActive =
    activePicker?.dayKey === 'everyday' && activePicker?.type === 'openTime';
  const isEverydayClosePickerActive =
    activePicker?.dayKey === 'everyday' && activePicker?.type === 'closeTime';

  return (
    <Container style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <GymLoader visible={isSaving || updateClubOwner.isPending} />

      {/* HEADER */}
      <View className="flex-row items-center justify-between py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100">
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-sans font-bold text-[18px] text-[#1C1C1C] text-center flex-1 mr-10">
          Club Timings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-1"
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* CLOCK ANIMATION ICON */}
        <View className="items-center mt-2 mb-4">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-[#FFF0F2] mb-3">
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                borderWidth: 3,
                borderColor: '#F6163C',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
              {/* Pivot */}
              <View
                style={{
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#F6163C',
                  zIndex: 10,
                }}
              />
              {/* Hour Hand */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 4,
                  height: 20,
                  transform: [{ rotate: hourSpin }],
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}>
                <View
                  style={{
                    width: 2.5,
                    height: 10,
                    backgroundColor: '#1E293B',
                    borderRadius: 1.5,
                  }}
                />
              </Animated.View>
              {/* Minute Hand */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 3,
                  height: 28,
                  transform: [{ rotate: minuteSpin }],
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}>
                <View
                  style={{
                    width: 2,
                    height: 14,
                    backgroundColor: '#F6163C',
                    borderRadius: 1,
                  }}
                />
              </Animated.View>
              {/* Second Hand */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 2,
                  height: 34,
                  transform: [{ rotate: secondSpin }],
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}>
                <View
                  style={{
                    width: 1,
                    height: 17,
                    backgroundColor: '#E11D48',
                    borderRadius: 0.5,
                  }}
                />
              </Animated.View>
            </View>
          </View>

          <Text className="font-sans font-extrabold text-[20px] text-[#1C1C1C] text-center">
            Working Hours & Schedule
          </Text>
          <Text className="mt-1 text-center font-sans text-[12px] font-normal leading-[18px] text-slate-400 max-w-[90%]">
            Configure your club operating hours and open days for members.
          </Text>
        </View>

        {/* --- EVERYDAY MASTER TOGGLE CARD --- */}
        <View
          className="mb-5 rounded-2xl border p-4 shadow-sm"
          style={{
            borderColor: isEverydayMode ? '#F6163C' : '#E2E8F0',
            backgroundColor: isEverydayMode ? '#FFF8F8' : '#FFFFFF',
          }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-3">
              <View
                className="h-10 w-10 items-center justify-center rounded-xl mr-3"
                style={{ backgroundColor: isEverydayMode ? '#FFE4E6' : '#F1F5F9' }}>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={isEverydayMode ? '#F6163C' : '#64748B'}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="font-bold text-[15px]"
                  style={{ color: isEverydayMode ? '#1C1C1C' : '#334155' }}>
                  Everyday Schedule
                </Text>
                <Text className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Monday to Sunday (Same timings every day)
                </Text>
              </View>
            </View>

            <Switch
              value={isEverydayMode}
              onValueChange={toggleEverydayMode}
              trackColor={{ false: '#CBD5E1', true: '#F6163C' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#CBD5E1"
            />
          </View>

          {/* Time Pickers for Everyday Mode */}
          {isEverydayMode && (
            <View
              className="mt-3.5 pt-3 flex-row items-center justify-between border-t"
              style={{ borderColor: '#FFE4E6' }}>
              <Text className="font-bold text-[12px] text-slate-700">Everyday Timing:</Text>
              <View className="flex-row items-center">
                {/* Open Time Pill */}
                <TouchableOpacity
                  onPress={() =>
                    setActivePicker(
                      isEverydayOpenPickerActive
                        ? null
                        : { dayKey: 'everyday', type: 'openTime' }
                    )
                  }
                  activeOpacity={0.7}
                  className="flex-row items-center rounded-xl border px-3 py-1.5"
                  style={{
                    borderColor: isEverydayOpenPickerActive ? '#F6163C' : '#FECDD3',
                    backgroundColor: '#FFFFFF',
                  }}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color="#F6163C"
                    style={{ marginRight: 4 }}
                  />
                  <Text className="font-bold text-[13px] text-slate-900">
                    {everydayOpenParts.time}
                  </Text>
                  <Text className="ml-1 text-[10px] font-bold text-[#F6163C]">
                    {everydayOpenParts.ampm}
                  </Text>
                </TouchableOpacity>

                <Text className="font-bold text-[12px] text-slate-400 mx-1.5">-</Text>

                {/* Close Time Pill */}
                <TouchableOpacity
                  onPress={() =>
                    setActivePicker(
                      isEverydayClosePickerActive
                        ? null
                        : { dayKey: 'everyday', type: 'closeTime' }
                    )
                  }
                  activeOpacity={0.7}
                  className="flex-row items-center rounded-xl border px-3 py-1.5"
                  style={{
                    borderColor: isEverydayClosePickerActive ? '#F6163C' : '#FECDD3',
                    backgroundColor: '#FFFFFF',
                  }}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color="#F6163C"
                    style={{ marginRight: 4 }}
                  />
                  <Text className="font-bold text-[13px] text-slate-900">
                    {everydayCloseParts.time}
                  </Text>
                  <Text className="ml-1 text-[10px] font-bold text-[#F6163C]">
                    {everydayCloseParts.ampm}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* --- SCHEDULE TABLE HEADER --- */}
        <View
          className="mb-2 flex-row items-center justify-between border-b pb-2 px-1"
          style={{ borderColor: '#E2E8F0' }}>
          <Text className="w-[34%] font-bold text-[11px] uppercase tracking-wider text-slate-400">
            Day
          </Text>
          <Text className="w-[60%] text-right font-bold text-[11px] uppercase tracking-wider text-slate-400">
            {isEverydayMode ? 'Operating Schedule' : 'Open - Close Timings'}
          </Text>
        </View>

        {/* --- 7 DAY SCHEDULE ROWS --- */}
        {DAYS_CONFIG.map(({ key, name }) => {
          const dayData = daySchedules[key] || {
            isOpen: true,
            openTime: ensureDate(undefined, 6),
            closeTime: ensureDate(undefined, 22),
          };
          const openParts = formatTimeParts(
            isEverydayMode ? everydayOpenTime : dayData.openTime,
            6
          );
          const closeParts = formatTimeParts(
            isEverydayMode ? everydayCloseTime : dayData.closeTime,
            22
          );

          const isOpeningPickerActive =
            activePicker?.dayKey === key && activePicker?.type === 'openTime';
          const isClosingPickerActive =
            activePicker?.dayKey === key && activePicker?.type === 'closeTime';

          return (
            <View key={key} className="mb-2.5">
              <View
                className="flex-row items-center justify-between rounded-2xl border p-2.5"
                style={{
                  borderColor: isEverydayMode
                    ? '#E2E8F0'
                    : dayData.isOpen
                    ? '#CBD5E1'
                    : '#F1F5F9',
                  backgroundColor:
                    isEverydayMode || dayData.isOpen ? '#FFFFFF' : '#F8FAFC',
                }}>
                {/* Day Column + Toggle */}
                <View className="w-[38%] shrink-0 flex-row items-center">
                  <Switch
                    value={isEverydayMode ? true : Boolean(dayData.isOpen)}
                    onValueChange={() => toggleDayOpen(key)}
                    trackColor={{ false: '#CBD5E1', true: '#F6163C' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#CBD5E1"
                  />
                  <TouchableOpacity
                    onPress={() => toggleDayOpen(key)}
                    activeOpacity={0.7}
                    className="flex-1 shrink ml-2">
                    <Text
                      numberOfLines={1}
                      className="font-bold text-[13px]"
                      style={{
                        color:
                          isEverydayMode || dayData.isOpen ? '#0F172A' : '#94A3B8',
                      }}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Open & Close Timings */}
                {isEverydayMode ? (
                  // In Everyday Mode: Timings are synced automatically
                  <View className="flex-1 flex-row items-center justify-end">
                    <View
                      className="rounded-xl border px-2.5 py-1.5 flex-row items-center"
                      style={{
                        borderColor: '#F1F5F9',
                        backgroundColor: '#F8FAFC',
                      }}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color="#64748B"
                        style={{ marginRight: 4 }}
                      />
                      <Text className="font-bold text-[12px] text-slate-800">
                        {openParts.time} {openParts.ampm} - {closeParts.time}{' '}
                        {closeParts.ampm}
                      </Text>
                    </View>
                  </View>
                ) : dayData.isOpen ? (
                  // Custom Days Mode: Per-Day Pickers
                  <View className="flex-1 flex-row items-center justify-end space-x-1">
                    {/* Open Time Pill */}
                    <TouchableOpacity
                      onPress={() =>
                        setActivePicker(
                          isOpeningPickerActive
                            ? null
                            : { dayKey: key, type: 'openTime' }
                        )
                      }
                      activeOpacity={0.7}
                      className="flex-row items-center rounded-xl border px-2 py-1.5"
                      style={{
                        borderColor: isOpeningPickerActive ? '#F6163C' : '#CBD5E1',
                        backgroundColor: isOpeningPickerActive
                          ? '#FFF1F2'
                          : '#F8FAFC',
                      }}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={isOpeningPickerActive ? '#F6163C' : '#64748B'}
                        style={{ marginRight: 3 }}
                      />
                      <Text className="font-bold text-[12px] text-slate-900">
                        {openParts.time}
                      </Text>
                      <Text className="ml-1 text-[9px] font-bold text-slate-500">
                        {openParts.ampm}
                      </Text>
                    </TouchableOpacity>

                    <Text className="font-bold text-[11px] text-slate-300 mx-0.5">
                      -
                    </Text>

                    {/* Close Time Pill */}
                    <TouchableOpacity
                      onPress={() =>
                        setActivePicker(
                          isClosingPickerActive
                            ? null
                            : { dayKey: key, type: 'closeTime' }
                        )
                      }
                      activeOpacity={0.7}
                      className="flex-row items-center rounded-xl border px-2 py-1.5"
                      style={{
                        borderColor: isClosingPickerActive ? '#F6163C' : '#CBD5E1',
                        backgroundColor: isClosingPickerActive
                          ? '#FFF1F2'
                          : '#F8FAFC',
                      }}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={isClosingPickerActive ? '#F6163C' : '#64748B'}
                        style={{ marginRight: 3 }}
                      />
                      <Text className="font-bold text-[12px] text-slate-900">
                        {closeParts.time}
                      </Text>
                      <Text className="ml-1 text-[9px] font-bold text-slate-500">
                        {closeParts.ampm}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="flex-1 items-end pr-1">
                    <View className="rounded-full bg-slate-200 px-2.5 py-0.5">
                      <Text className="font-semibold text-[11px] text-slate-500">
                        Closed
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* --- FIXED BOTTOM ACTION BUTTONS --- */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-5 py-4">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              title={isSaving || updateClubOwner.isPending ? 'Saving...' : 'Save Timings'}
              onPress={handleSaveTimings}
              disabled={isSaving || updateClubOwner.isPending}
              loading={isSaving || updateClubOwner.isPending}
            />
          </View>
          <View className="flex-1">
            <Button
              variant="secondary"
              title="Cancel"
              onPress={() => router.back()}
              disabled={isSaving || updateClubOwner.isPending}
            />
          </View>
        </View>
      </View>

      {/* --- FITFOB RED TIME PICKER MODAL --- */}
      <CustomTimePickerModal
        visible={activePicker !== null}
        initialDate={
          activePicker
            ? activePicker.dayKey === 'everyday'
              ? activePicker.type === 'openTime'
                ? everydayOpenTime
                : everydayCloseTime
              : daySchedules[activePicker.dayKey]?.[activePicker.type] || new Date()
            : new Date()
        }
        title={
          activePicker
            ? activePicker.dayKey === 'everyday'
              ? `Everyday • ${
                  activePicker.type === 'openTime' ? 'Opening' : 'Closing'
                } Time`
              : `${
                  DAYS_CONFIG.find((d) => d.key === activePicker.dayKey)?.name || ''
                } • ${
                  activePicker.type === 'openTime' ? 'Opening' : 'Closing'
                } Time`
            : 'Select Time'
        }
        onConfirm={(selectedDate: Date) => {
          if (activePicker) {
            onCustomTimeChange(activePicker.dayKey, activePicker.type, selectedDate);
          }
          setActivePicker(null);
        }}
        onCancel={() => setActivePicker(null)}
      />
    </Container>
  );
}
