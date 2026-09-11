/* eslint-disable no-unused-expressions */
import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Modal, Alert, Switch, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomTimePickerModal from '@/components/CustomTimePickerModal';
import ClubCategoryInfoModal from '@/components/ClubCategoryInfoModal';
import LineGradient from '../lineGradient/LineGradient';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';
import { userDetailsApi } from '@/api/userdetailsApi';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Props interface for TypeScript safety
interface OnBoarding3Props {
  initialData?: any;
  onNext?: () => void;
}

const DAYS_CONFIG = [
  { key: 'monday', name: 'Monday', short: 'Mon' },
  { key: 'tuesday', name: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', name: 'Wednesday', short: 'Wed' },
  { key: 'thursday', name: 'Thursday', short: 'Thu' },
  { key: 'friday', name: 'Friday', short: 'Fri' },
  { key: 'saturday', name: 'Saturday', short: 'Sat' },
  { key: 'sunday', name: 'Sunday', short: 'Sun' },
];

const ensureDate = (val: any, defaultHour: number = 6): Date => {
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof val === 'string') {
    const clean = val.trim();
    const ampmMatch = clean.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    }
    const time24Match = clean.match(/^(\d{1,2}):(\d{2})/);
    if (time24Match) {
      const hours = parseInt(time24Match[1], 10);
      const minutes = parseInt(time24Match[2], 10);
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  const fallback = new Date();
  fallback.setHours(defaultHour, 0, 0, 0);
  return fallback;
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

const createInitialDaySchedules = () => {
  const defaults: Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }> = {};
  DAYS_CONFIG.forEach(({ key }) => {
    defaults[key] = {
      isOpen: true,
      openTime: ensureDate(undefined, 6),
      closeTime: ensureDate(undefined, 22),
    };
  });
  return defaults;
};

const OnBoarding3 = forwardRef((props: OnBoarding3Props, ref) => {
  const insets = useSafeAreaInsets();
  const { initialData } = props;
  const { submitStep4, profileStatus: userData } = useUserDetail();
  const { user } = useAuthStore();
  const userId = userData?.id || userData?.pendingClubOwnerId;
  const STORAGE_KEY = `@onboarding_step3_data_${userId || user?.id || user?.email || 'guest'}`;

  // --- CLUB CATEGORY ---
  const [clubCategory, setClubCategory] = useState('Luxury');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryInfoModal, setShowCategoryInfoModal] = useState(true);
  const categoryOptions = ['Luxury', 'Premium'];

  const [fitnessTypes, setFitnessTypes] = useState(['Gym']);
  const [amenities, setAmenities] = useState(['Parking', 'Wi-Fi']);

  // Fetch dynamic club services & facilities from API
  const { data: servicesData, isLoading: isServicesLoading } = useQuery<string[]>({
    queryKey: ['club-services-list'],
    queryFn: userDetailsApi.getClubServices,
    staleTime: 10 * 60 * 1000,
  });

  const { data: facilitiesData, isLoading: isFacilitiesLoading } = useQuery<string[]>({
    queryKey: ['club-facilities-list'],
    queryFn: userDetailsApi.getClubFacilities,
    staleTime: 10 * 60 * 1000,
  });

  const availableServices = Array.isArray(servicesData) ? servicesData : [];
  const availableFacilities = Array.isArray(facilitiesData) ? facilitiesData : [];

  // Skeleton pulse animation
  const skeletonOpacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonOpacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [skeletonOpacity]);

  // --- EVERYDAY MODE STATE ---
  const [isEverydayMode, setIsEverydayMode] = useState(true);
  const [everydayOpenTime, setEverydayOpenTime] = useState<Date>(() => ensureDate(undefined, 6));
  const [everydayCloseTime, setEverydayCloseTime] = useState<Date>(() => ensureDate(undefined, 22));

  // --- PER DAY SCHEDULE STATE ---
  const [daySchedules, setDaySchedules] = useState<
    Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }>
  >(createInitialDaySchedules);

  // Active time picker: { dayKey: 'everyday' | 'monday' | 'tuesday'..., type: 'openTime' | 'closeTime' }
  const [activePicker, setActivePicker] = useState<{
    dayKey: string;
    type: 'openTime' | 'closeTime';
  } | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);

  const parseTimeStringToDate = (timeStr?: string, defaultHour: number = 6) => {
    return ensureDate(timeStr, defaultHour);
  };

  // 1. Initial Load from Local Storage (Priority 1) or initialData (Fallback)
  useEffect(() => {
    const initData = async () => {
      if (isInitialized) return;

      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const data = initialData || userData;

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.clubCategory) setClubCategory(parsed.clubCategory);
          if (parsed.fitnessTypes) setFitnessTypes(parsed.fitnessTypes);
          if (parsed.amenities) setAmenities(parsed.amenities);
          if (parsed.isEverydayMode !== undefined) setIsEverydayMode(parsed.isEverydayMode);
          if (parsed.everydayOpenTime) setEverydayOpenTime(ensureDate(parsed.everydayOpenTime, 6));
          if (parsed.everydayCloseTime) setEverydayCloseTime(ensureDate(parsed.everydayCloseTime, 22));

          if (parsed.daySchedules) {
            const restored: Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }> = {};
            DAYS_CONFIG.forEach(({ key }) => {
              const item = parsed.daySchedules[key];
              if (item) {
                restored[key] = {
                  isOpen: item.isOpen ?? true,
                  openTime: ensureDate(item.openTime, 6),
                  closeTime: ensureDate(item.closeTime, 22),
                };
              } else {
                restored[key] = createInitialDaySchedules()[key];
              }
            });
            setDaySchedules(restored);
          }
        } catch (e) {
          console.error('Error parsing saved onboarding step 3 state:', e);
        }
      } else if (data) {
        const extractNames = (arr: any) => {
          if (!arr || !Array.isArray(arr)) return [];
          return arr.map((item: any) => (typeof item === 'string' ? item : item.name || item.title || item.label || ''));
        };

        const resolvedCategory = data.clubCategory || data.category || 'Luxury';
        const resolvedServices = extractNames(data.services || data.clubServices || data.fitnessTypes || []);
        const resolvedFacilities = extractNames(data.facilities || data.clubFacilities || data.amenities || []);

        setClubCategory(resolvedCategory);
        if (resolvedServices.length > 0) setFitnessTypes(resolvedServices);
        if (resolvedFacilities.length > 0) setAmenities(resolvedFacilities);

        const scheduling = data.weekdayScheduling || data.scheduling;
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
            // Check if all 7 days exist with the same opening & closing time
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
        }
      }
      setIsInitialized(true);
    };
    initData();
  }, [initialData, userData, isInitialized, STORAGE_KEY]);

  const formatTime24h = (timeInput: any, defaultHour: number = 6) => {
    const dateObj = ensureDate(timeInput, defaultHour);
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 2. Draft backup
  useEffect(() => {
    if (isInitialized) {
      const openStr = formatTime24h(everydayOpenTime, 6);
      const closeStr = formatTime24h(everydayCloseTime, 22);

      let weekdayScheduling: Record<string, { openingTime: string; closingTime: string }> = {};
      if (isEverydayMode) {
        weekdayScheduling = {
          everyday: {
            openingTime: openStr,
            closingTime: closeStr,
          },
        };
      } else {
        DAYS_CONFIG.forEach(({ key }) => {
          if (daySchedules[key]?.isOpen) {
            weekdayScheduling[key] = {
              openingTime: formatTime24h(daySchedules[key].openTime, 6),
              closingTime: formatTime24h(daySchedules[key].closeTime, 22),
            };
          }
        });
      }

      const draft = {
        clubCategory,
        fitnessTypes,
        amenities,
        isEverydayMode,
        everydayOpenTime,
        everydayCloseTime,
        daySchedules,
        weekdayScheduling,
        openingTime: openStr,
        closingTime: closeStr,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [
    clubCategory,
    fitnessTypes,
    amenities,
    isEverydayMode,
    everydayOpenTime,
    everydayCloseTime,
    daySchedules,
    isInitialized,
    STORAGE_KEY,
  ]);

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

  const toggleEverydayMode = (enabled: boolean) => {
    setActivePicker(null);
    setIsEverydayMode(enabled);
    if (enabled) {
      // Sync all days to Everyday times
      setDaySchedules((prev) => {
        const updated: Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }> = {};
        DAYS_CONFIG.forEach(({ key }) => {
          updated[key] = {
            isOpen: true,
            openTime: ensureDate(everydayOpenTime, 6),
            closeTime: ensureDate(everydayCloseTime, 22),
          };
        });
        return updated;
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

  const onCustomTimeChange = (dayKey: string, type: 'openTime' | 'closeTime', selectedDate: Date) => {
    const validDate = ensureDate(selectedDate);
    if (dayKey === 'everyday') {
      if (type === 'openTime') {
        setEverydayOpenTime(validDate);
      } else {
        setEverydayCloseTime(validDate);
      }
      // Sync to all days
      setDaySchedules((prev) => {
        const updated: Record<string, { isOpen: boolean; openTime: Date; closeTime: Date }> = {};
        DAYS_CONFIG.forEach(({ key }) => {
          updated[key] = {
            isOpen: true,
            openTime: type === 'openTime' ? validDate : ensureDate(prev[key]?.openTime, 6),
            closeTime: type === 'closeTime' ? validDate : ensureDate(prev[key]?.closeTime, 22),
          };
        });
        return updated;
      });
    } else {
      setDaySchedules((prev) => ({
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          [type]: validDate,
        },
      }));
    }
  };

  useImperativeHandle(ref, () => ({
    getFormData: () => ({
      clubCategory,
      fitnessTypes,
      amenities,
      isEverydayMode,
      everydayOpenTime,
      everydayCloseTime,
      daySchedules,
    }),
    handleSave: async () => {
      if (!fitnessTypes || fitnessTypes.length === 0) {
        return Alert.alert('Required', 'Please select at least one fitness service (e.g. Gym or Yoga).');
      }

      if (!amenities || amenities.length === 0) {
        return Alert.alert('Required', 'Please select at least one amenity (e.g. Parking or Wi-Fi).');
      }

      let weekdayScheduling: Record<string, { openingTime: string; closingTime: string }> = {};
      let defaultOpeningTime = '06:00';
      let defaultClosingTime = '22:00';

      if (isEverydayMode) {
        const openStr = formatTime12h(everydayOpenTime, 6);
        const closeStr = formatTime12h(everydayCloseTime, 22);
        defaultOpeningTime = openStr;
        defaultClosingTime = closeStr;
        weekdayScheduling = {
          everyday: {
            openingTime: openStr,
            closingTime: closeStr,
          },
        };
      } else {
        const openDays = DAYS_CONFIG.filter(({ key }) => daySchedules[key]?.isOpen);
        if (openDays.length === 0) {
          return Alert.alert('Required', 'Please enable at least one operating day for your club.');
        }

        DAYS_CONFIG.forEach(({ key }) => {
          if (daySchedules[key]?.isOpen) {
            weekdayScheduling[key] = {
              openingTime: formatTime12h(daySchedules[key].openTime, 6),
              closingTime: formatTime12h(daySchedules[key].closeTime, 22),
            };
          }
        });

        const firstOpenDay = openDays[0]?.key;
        if (firstOpenDay && daySchedules[firstOpenDay]) {
          defaultOpeningTime = formatTime12h(daySchedules[firstOpenDay].openTime, 6);
          defaultClosingTime = formatTime12h(daySchedules[firstOpenDay].closeTime, 22);
        }
      }

      const payload = {
        services: fitnessTypes,
        facilities: amenities,
        weekdayScheduling,
        clubCategory,
        openingTime: defaultOpeningTime,
        closingTime: defaultClosingTime,
      };

      try {
        await submitStep4.mutateAsync(payload);

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

          const savedClub = await AsyncStorage.getItem('club_profile');
          const parsedClub = savedClub ? JSON.parse(savedClub) : {};
          const updatedClub = {
            ...parsedClub,
            services: fitnessTypes,
            facilities: amenities,
            amenities,
            clubCategory,
            weekdayScheduling,
            openingTime: defaultOpeningTime,
            closingTime: defaultClosingTime,
            isEverydayMode,
            everydayOpenTime: defaultOpeningTime,
            everydayCloseTime: defaultClosingTime,
            daySchedules: serializedDaySchedules,
          };
          await AsyncStorage.setItem('club_profile', JSON.stringify(updatedClub));
        } catch (storageErr) {
          console.error('Failed to sync club_profile from OnBoarding3:', storageErr);
        }

        if (props.onNext) props.onNext();
      } catch (err: any) {
        console.error('Error submitting step 4:', err);
        Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to save club details.');
      }
    },
  }));

  const isSelected = (list: string[], item: string) => {
    if (!Array.isArray(list)) return false;
    const normalized = item.toLowerCase().trim();
    return list.some((i) => typeof i === 'string' && i.toLowerCase().trim() === normalized);
  };

  const toggleSelection = (item: string, state: string[], setState: any) => {
    const normalized = item.toLowerCase().trim();
    const exists = state.some((i: string) => typeof i === 'string' && i.toLowerCase().trim() === normalized);
    if (exists) {
      setState(state.filter((i: string) => typeof i === 'string' && i.toLowerCase().trim() !== normalized));
    } else {
      setState([...state, item]);
    }
  };

  const CheckboxItem = ({ label, isSelected, onPress }: any) => (
    <View>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center py-4">
        <View
          className="mr-3 h-5 w-5 items-center justify-center rounded border"
          style={{
            borderColor: isSelected ? '#F6163C' : '#CBD5E1',
            backgroundColor: isSelected ? '#F6163C' : '#FFFFFF',
          }}>
          {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
        </View>
        <Text
          className="text-[15px]"
          style={{
            fontWeight: isSelected ? '600' : '400',
            color: isSelected ? '#0F172A' : '#64748B',
          }}>
          {label}
        </Text>
      </TouchableOpacity>
      <LineGradient />
    </View>
  );

  const CheckboxSkeleton = ({ width = 120 }: { width?: number }) => (
    <View>
      <View className="flex-row items-center py-4">
        <Animated.View
          className="mr-3 h-5 w-5 rounded bg-slate-200"
          style={{ opacity: skeletonOpacity }}
        />
        <Animated.View
          className="h-4 rounded bg-slate-200"
          style={{ width, opacity: skeletonOpacity }}
        />
      </View>
      <LineGradient />
    </View>
  );

  const everydayOpenParts = formatTimeParts(everydayOpenTime);
  const everydayCloseParts = formatTimeParts(everydayCloseTime);
  const isEverydayOpenPickerActive = activePicker?.dayKey === 'everyday' && activePicker?.type === 'openTime';
  const isEverydayClosePickerActive = activePicker?.dayKey === 'everyday' && activePicker?.type === 'closeTime';

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-1 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="mb-6 font-bold text-[24px] leading-8 text-[#1C1C1C]">Configure your club</Text>

        {/* --- CLUB CATEGORY DROPDOWN --- */}
        <View className="mb-6">
          <View className="mb-2 ml-1 flex-row items-center justify-between">
            <Text className="font-sans text-sm font-normal text-[#697281]">Club Category</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryInfoModal(true)}
              activeOpacity={0.7}
              className="flex-row items-center px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100">
              <Ionicons name="information-circle" size={14} color="#F6163C" />
              <Text className="text-[12px] font-semibold text-[#F6163C] ml-1">Info</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.7}
            className="h-14 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-5">
            <Text className="font-medium text-slate-900">{clubCategory}</Text>
            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* --- TYPE OF FITNESS CLUB --- */}
        <View className="mb-6">
          <Text className="mb-2 ml-1 font-sans text-sm font-normal text-[#697281]">Type of Fitness club</Text>
          {isServicesLoading ? (
            <>
              <CheckboxSkeleton width={110} />
              <CheckboxSkeleton width={80} />
              <CheckboxSkeleton width={140} />
              <CheckboxSkeleton width={100} />
              <CheckboxSkeleton width={125} />
              <CheckboxSkeleton width={90} />
            </>
          ) : (
            availableServices.map((item) => (
              <CheckboxItem
                key={item}
                label={item}
                isSelected={isSelected(fitnessTypes, item)}
                onPress={() => toggleSelection(item, fitnessTypes, setFitnessTypes)}
              />
            ))
          )}
        </View>

        {/* --- AMENITIES --- */}
        <View className="mb-6">
          <Text className="mb-2 ml-1 font-sans text-sm font-normal text-[#697281]">Amenities</Text>
          {isFacilitiesLoading ? (
            <>
              <CheckboxSkeleton width={70} />
              <CheckboxSkeleton width={130} />
              <CheckboxSkeleton width={95} />
            </>
          ) : (
            availableFacilities.map((item) => (
              <CheckboxItem
                key={item}
                label={item}
                isSelected={isSelected(amenities, item)}
                onPress={() => toggleSelection(item, amenities, setAmenities)}
              />
            ))
          )}
        </View>

        {/* --- OPERATING DAYS & HOURS SECTION --- */}
        <View
          className="mb-10 rounded-3xl border p-4"
          style={{
            borderColor: '#F1F5F9',
            backgroundColor: '#F8FAFC',
          }}>
          <Text className="font-bold text-[18px] text-slate-900">Gym Timing</Text>
          <Text className="mb-4 font-sans text-xs text-[#697281]">Set your club timing schedule</Text>

          {/* EVERYDAY MASTER CARD */}
          <View
            className="mb-4 rounded-2xl border p-3.5"
            style={{
              borderColor: isEverydayMode ? '#FECDD3' : '#E2E8F0',
              backgroundColor: isEverydayMode ? '#FFF1F2' : '#FFFFFF',
            }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center space-x-2.5 pr-2 shrink">
                <Switch
                  value={isEverydayMode}
                  onValueChange={toggleEverydayMode}
                  trackColor={{ false: '#CBD5E1', true: '#F6163C' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#CBD5E1"
                />
                <TouchableOpacity
                  onPress={() => toggleEverydayMode(!isEverydayMode)}
                  activeOpacity={0.7}
                  className="flex-1 shrink ml-2">
                  <Text numberOfLines={1} className="font-bold text-[15px] text-slate-900">
                    Everyday (Same timing for all days)
                  </Text>
                  <Text numberOfLines={1} className="text-[11px] text-slate-500 mt-0.5">
                    {isEverydayMode ? 'Set timing once for all 7 days' : 'Turn ON to set single timing for all days'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Pickers for Everyday Mode */}
            {isEverydayMode && (
              <View
                className="mt-3 pt-3 flex-row items-center justify-between border-t"
                style={{ borderColor: '#FFE4E6' }}>
                <Text className="font-bold text-[12px] text-slate-700">Everyday Timing:</Text>
                <View className="flex-row items-center space-x-1.5">
                  {/* Open Time Pill */}
                  <TouchableOpacity
                    onPress={() =>
                      setActivePicker(isEverydayOpenPickerActive ? null : { dayKey: 'everyday', type: 'openTime' })
                    }
                    activeOpacity={0.7}
                    className="flex-row items-center rounded-xl border px-2.5 py-1.5"
                    style={{
                      borderColor: isEverydayOpenPickerActive ? '#F6163C' : '#FECDD3',
                      backgroundColor: '#FFFFFF',
                    }}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color="#F6163C"
                      style={{ marginRight: 4 }}
                    />
                    <Text className="font-bold text-[13px] text-slate-900">{everydayOpenParts.time}</Text>
                    <Text className="ml-1 text-[9px] font-bold text-[#F6163C]">{everydayOpenParts.ampm}</Text>
                  </TouchableOpacity>

                  <Text className="font-bold text-[12px] text-slate-400 mx-1">-</Text>

                  {/* Close Time Pill */}
                  <TouchableOpacity
                    onPress={() =>
                      setActivePicker(isEverydayClosePickerActive ? null : { dayKey: 'everyday', type: 'closeTime' })
                    }
                    activeOpacity={0.7}
                    className="flex-row items-center rounded-xl border px-2.5 py-1.5"
                    style={{
                      borderColor: isEverydayClosePickerActive ? '#F6163C' : '#FECDD3',
                      backgroundColor: '#FFFFFF',
                    }}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color="#F6163C"
                      style={{ marginRight: 4 }}
                    />
                    <Text className="font-bold text-[13px] text-slate-900">{everydayCloseParts.time}</Text>
                    <Text className="ml-1 text-[9px] font-bold text-[#F6163C]">{everydayCloseParts.ampm}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Table Header Labels */}
          <View
            className="mb-2 flex-row items-center justify-between border-b pb-2 px-1"
            style={{ borderColor: '#E2E8F0' }}>
            <Text className="w-[34%] font-bold text-[11px] uppercase tracking-wider text-slate-400">Day</Text>
            <Text className="w-[60%] text-right font-bold text-[11px] uppercase tracking-wider text-slate-400">
              {isEverydayMode ? 'Operating Schedule' : 'Open - Close Timings'}
            </Text>
          </View>

          {/* Per Day Schedule Rows */}
          {DAYS_CONFIG.map(({ key, name }) => {
            const dayData = daySchedules[key] || {
              isOpen: true,
              openTime: ensureDate(undefined, 6),
              closeTime: ensureDate(undefined, 22),
            };
            const openParts = formatTimeParts(isEverydayMode ? everydayOpenTime : dayData.openTime, 6);
            const closeParts = formatTimeParts(isEverydayMode ? everydayCloseTime : dayData.closeTime, 22);

            const isOpeningPickerActive = activePicker?.dayKey === key && activePicker?.type === 'openTime';
            const isClosingPickerActive = activePicker?.dayKey === key && activePicker?.type === 'closeTime';
            const isDayPickerActive = activePicker?.dayKey === key;

            return (
              <View key={key} className="mb-2.5">
                <View
                  className="flex-row items-center justify-between rounded-2xl border p-2.5"
                  style={{
                    borderColor: isEverydayMode ? '#E2E8F0' : dayData.isOpen ? '#CBD5E1' : '#F1F5F9',
                    backgroundColor: isEverydayMode || dayData.isOpen ? '#FFFFFF' : '#F8FAFC',
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
                          color: isEverydayMode || dayData.isOpen ? '#0F172A' : '#94A3B8',
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
                        style={{ borderColor: '#F1F5F9', backgroundColor: '#F8FAFC' }}>
                        <Ionicons name="time-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
                        <Text className="font-bold text-[12px] text-slate-800">
                          {openParts.time} {openParts.ampm} - {closeParts.time} {closeParts.ampm}
                        </Text>
                      </View>
                    </View>
                  ) : dayData.isOpen ? (
                    // Custom Days Mode: Per-Day Pickers
                    <View className="flex-1 flex-row items-center justify-end space-x-1">
                      {/* Open Time Pill */}
                      <TouchableOpacity
                        onPress={() =>
                          setActivePicker(isOpeningPickerActive ? null : { dayKey: key, type: 'openTime' })
                        }
                        activeOpacity={0.7}
                        className="flex-row items-center rounded-xl border px-2 py-1.5"
                        style={{
                          borderColor: isOpeningPickerActive ? '#F6163C' : '#CBD5E1',
                          backgroundColor: isOpeningPickerActive ? '#FFF1F2' : '#F8FAFC',
                        }}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={isOpeningPickerActive ? '#F6163C' : '#64748B'}
                          style={{ marginRight: 3 }}
                        />
                        <Text className="font-bold text-[12px] text-slate-900">{openParts.time}</Text>
                        <Text className="ml-1 text-[9px] font-bold text-slate-500">{openParts.ampm}</Text>
                      </TouchableOpacity>

                      <Text className="font-bold text-[11px] text-slate-300 mx-0.5">-</Text>

                      {/* Close Time Pill */}
                      <TouchableOpacity
                        onPress={() =>
                          setActivePicker(isClosingPickerActive ? null : { dayKey: key, type: 'closeTime' })
                        }
                        activeOpacity={0.7}
                        className="flex-row items-center rounded-xl border px-2 py-1.5"
                        style={{
                          borderColor: isClosingPickerActive ? '#F6163C' : '#CBD5E1',
                          backgroundColor: isClosingPickerActive ? '#FFF1F2' : '#F8FAFC',
                        }}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={isClosingPickerActive ? '#F6163C' : '#64748B'}
                          style={{ marginRight: 3 }}
                        />
                        <Text className="font-bold text-[12px] text-slate-900">{closeParts.time}</Text>
                        <Text className="ml-1 text-[9px] font-bold text-slate-500">{closeParts.ampm}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="flex-1 items-end pr-1">
                      <View className="rounded-full bg-slate-200 px-2.5 py-0.5">
                        <Text className="font-semibold text-[11px] text-slate-500">Closed</Text>
                      </View>
                    </View>
                  )}
                </View>

              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* --- CLUB CATEGORY MODAL --- */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowCategoryModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            justifyContent: 'flex-end',
          }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowCategoryModal(false)}
          />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 10,
            }}>
            <View className="mb-6 h-1.5 w-12 self-center rounded-full bg-slate-200" />
            <Text className="mb-6 text-center font-bold text-xl text-slate-900">Select Category</Text>

            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  setClubCategory(option);
                  setShowCategoryModal(false);
                }}
                className="flex-row items-center justify-between border-b border-slate-50 py-4">
                <Text
                  className="text-[16px]"
                  style={{
                    fontWeight: clubCategory === option ? '700' : '400',
                    color: clubCategory === option ? '#F6163C' : '#334155',
                  }}>
                  {option}
                </Text>
                {clubCategory === option && <Ionicons name="checkmark-circle" size={24} color="#F6163C" />}
              </TouchableOpacity>
            ))}

            {/* View Guidelines Link */}
            <TouchableOpacity
              onPress={() => {
                setShowCategoryModal(false);
                setTimeout(() => setShowCategoryInfoModal(true), 250);
              }}
              activeOpacity={0.7}
              className="mt-4 flex-row items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/50 py-3">
              <Ionicons name="information-circle" size={16} color="#F6163C" />
              <Text className="ml-1.5 text-xs font-semibold text-[#F6163C]">
                Need help? View Luxury vs Premium criteria
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- CLUB CATEGORY INFO BOTTOM SHEET MODAL --- */}
      <ClubCategoryInfoModal
        visible={showCategoryInfoModal}
        selectedCategory={clubCategory}
        onSelectCategory={(cat) => setClubCategory(cat)}
        onClose={() => setShowCategoryInfoModal(false)}
      />

      {/* --- FITFOB BRANDED RED TIME PICKER MODAL --- */}
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
              ? `Everyday • ${activePicker.type === 'openTime' ? 'Opening' : 'Closing'} Time`
              : `${DAYS_CONFIG.find((d) => d.key === activePicker.dayKey)?.name || ''} • ${
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
    </View>
  );
});

export default OnBoarding3;
