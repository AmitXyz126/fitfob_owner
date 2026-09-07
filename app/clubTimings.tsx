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
  const { profileStatus, updateClubOwner } = useUserDetail();
  const { data: myOwnerData } = useClubOwnerMe();

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
  const parseTimeStringToDate = (timeStr?: string, defaultHour: number = 6) => {
    const d = new Date();
    if (!timeStr) {
      d.setHours(defaultHour, 0, 0, 0);
      return d;
    }
    const clean = String(timeStr).trim();
    const ampmMatch = clean.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      d.setHours(hours, minutes, 0, 0);
      return d;
    }
    const parts = clean.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        d.setHours(hours, minutes, 0, 0);
        return d;
      }
    }
    d.setHours(defaultHour, 0, 0, 0);
    return d;
  };

  const ensureDate = (val: any, defaultHour: number = 6): Date => {
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === 'number') {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
    if (typeof val === 'string') {
      return parseTimeStringToDate(val, defaultHour);
    }
    const fallback = new Date();
    fallback.setHours(defaultHour, 0, 0, 0);
    return fallback;
  };

  const formatTime24h = (timeInput: any, defaultHour: number = 6) => {
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
    const loadData = async () => {
      let savedClubProfile: any = null;
      let savedStep3: any = null;
      let savedStep4: any = null;
      try {
        const json1 = await AsyncStorage.getItem('club_profile');
        if (json1) savedClubProfile = JSON.parse(json1);

        const keys = await AsyncStorage.getAllKeys();
        const step3Key = keys.find((k) => k.includes('onboarding_step3_data'));
        if (step3Key) {
          const json3 = await AsyncStorage.getItem(step3Key);
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

      const pData = profileStatus?.data || profileStatus || {};

      const scheduling =
        myOwnerData?.weekdayScheduling ||
        pData?.weekdayScheduling ||
        pData?.scheduling ||
        savedClubProfile?.weekdayScheduling ||
        savedStep3?.weekdayScheduling ||
        savedStep4?.weekdayScheduling;

      const rawOpen =
        myOwnerData?.openingTime ||
        pData?.openingTime ||
        pData?.opening_time ||
        savedClubProfile?.openingTime ||
        savedStep3?.startTime ||
        savedStep3?.openingTime ||
        savedStep4?.startTime ||
        savedStep4?.openingTime;

      const rawClose =
        myOwnerData?.closingTime ||
        pData?.closingTime ||
        pData?.closing_time ||
        savedClubProfile?.closingTime ||
        savedStep3?.endTime ||
        savedStep3?.closingTime ||
        savedStep4?.endTime ||
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

      setIsLoaded(true);
    };

    loadData();
  }, [profileStatus, myOwnerData]);

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
    if (isEverydayMode) return;
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
      openTimeStr = formatTime24h(everydayOpenTime, 6);
      closeTimeStr = formatTime24h(everydayCloseTime, 22);

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
          openingTime: formatTime24h(daySchedules[key].openTime, 6),
          closingTime: formatTime24h(daySchedules[key].closeTime, 22),
        };
      });

      const firstActive = activeDays[0];
      openTimeStr = formatTime24h(daySchedules[firstActive.key].openTime, 6);
      closeTimeStr = formatTime24h(daySchedules[firstActive.key].closeTime, 22);

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
      openingTime: `${openTimeStr}:00.000`,
      closingTime: `${closeTimeStr}:00.000`,
      weekday: weekdayStr,
      weekend: weekendStr,
    };

    setIsSaving(true);
    console.log('Sending timing payload from clubTimings:', payload);

    updateClubOwner.mutate(payload, {
      onSuccess: async () => {
        setIsSaving(false);
        try {
          // Update AsyncStorage club_profile
          const existing = await AsyncStorage.getItem('club_profile');
          const parsed = existing ? JSON.parse(existing) : {};
          const updated = {
            ...parsed,
            weekdayScheduling: weekdaySchedulingPayload,
            openingTime: payload.openingTime,
            closingTime: payload.closingTime,
            weekday: weekdayStr,
            weekend: weekendStr,
          };
          await AsyncStorage.setItem('club_profile', JSON.stringify(updated));

          // Also update draft steps if present
          const keys = await AsyncStorage.getAllKeys();
          const step3Key = keys.find((k) => k.includes('onboarding_step3_data'));
          if (step3Key) {
            const raw3 = await AsyncStorage.getItem(step3Key);
            if (raw3) {
              const p3 = JSON.parse(raw3);
              await AsyncStorage.setItem(
                step3Key,
                JSON.stringify({
                  ...p3,
                  weekdayScheduling: weekdaySchedulingPayload,
                  isEverydayMode,
                  everydayOpenTime,
                  everydayCloseTime,
                  daySchedules,
                })
              );
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
                    value={isEverydayMode ? true : dayData.isOpen}
                    disabled={isEverydayMode}
                    onValueChange={() => toggleDayOpen(key)}
                    trackColor={{ false: '#CBD5E1', true: '#F6163C' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#CBD5E1"
                    style={{ opacity: isEverydayMode ? 0.6 : 1 }}
                  />
                  <TouchableOpacity
                    onPress={() => toggleDayOpen(key)}
                    disabled={isEverydayMode}
                    activeOpacity={isEverydayMode ? 1 : 0.7}
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
