import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Modal, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useUserDetail, useClubOwnerMe } from '@/hooks/useUserDetail';
import { useTodayCheckins } from '@/hooks/useTodayCheckins';
import { useAuthStore } from '@/store/useAuthStore';
import { RefreshSoundPlayer, RefreshSoundPlayerRef } from '@/components/RefreshSoundPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

export const formatIndianCurrency = (amount: number | string): string => {
  if (amount === undefined || amount === null || amount === '') return '₹0';
  const cleanStr = String(amount).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return `₹${amount}`;
  return `₹${num.toLocaleString('en-IN')}`;
};

export const formatIndianNumber = (numVal: number | string): string => {
  if (numVal === undefined || numVal === null || numVal === '') return '0';
  const cleanStr = String(numVal).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return String(numVal);
  return num.toLocaleString('en-IN');
};

// Dynamic item sizing for check-in animated list
const ITEM_SIZE = 84;

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
  <View className="mb-3 flex-row items-center rounded-2xl border border-slate-100 bg-white p-3">
    <SkeletonBox className="h-14 w-14 rounded-xl" />
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
        activeOpacity={0.7}
        onPress={() => onSelect(item)}
        className="mb-3 flex-row items-center rounded-2xl border border-slate-100 bg-white p-3">
        {/* Member Avatar with Skeleton while image loads */}
        <View className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100 items-center justify-center">
          {!imageLoaded && hasValidImage && (
            <SkeletonBox style={StyleSheet.absoluteFill} />
          )}
          <Image
            source={
              hasValidImage
                ? { uri: item.image }
                : require('../../assets/images/fitfob_profile.png')
            }
            className="h-14 w-14 rounded-xl"
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
            onLoadEnd={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
        </View>

        <View className="ml-4 flex-1 ">
          <View className="flex-row items-center gap-1 ">
            <Text className="font-bold text-[15px] text-slate-900">{item.name}</Text>
            <Image className="h-4 w-4" source={require('../../assets/images/tick.png')} />
          </View>
          <Text className="text-xs text-slate-400">{item.time}</Text>
        </View>

        <View
          style={{
            backgroundColor: `${item.color}15`,
            borderColor: `${item.color}30`,
            width: 95,
          }}
          className="flex-row items-center justify-center gap-1 rounded-full border py-1.5">
          <Image
            source={
              item.type === 'Luxury'
                ? require('../../assets/images/luxury.png')
                : item.type === 'Premium'
                  ? require('../../assets/images/premium.png')
                  : require('../../assets/images/standardicon.png')
            }
            style={{ width: 15, height: 15 }}
            resizeMode="contain"
          />

          <Text
            style={{ color: item.color }}
            className="text-[12px] font-normal "
            numberOfLines={1}>
            {item.type}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getImageUriString = (val: any): string => {
  if (!val) return '';
  let str = '';
  if (typeof val === 'string') {
    str = val;
  } else if (Array.isArray(val) && val.length > 0) {
    return getImageUriString(val[0]);
  } else if (typeof val === 'object') {
    str = val.logoUrl || val.url || val.uri || val.path || val.src || '';
  }
  if (!str) return '';
  if (str.startsWith('/')) {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
    if (baseUrl) {
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      return `${cleanBase}${str}`;
    }
  }
  return str;
};

const HomeScreen = () => {
  const { profileStatus, refetch } = useUserDetail();
  const { data: myOwnerData, refetch: refetchOwner } = useClubOwnerMe();
  const {
    checkins: recentCheckins,
    count: todayCheckinsCount,
    isLoading: isCheckinsLoading,
    refetch: refetchTodayCheckins,
  } = useTodayCheckins();
  const { user } = useAuthStore();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [storedClubName, setStoredClubName] = useState<string>('');
  const [storedOwnerName, setStoredOwnerName] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const refreshSoundRef = useRef<RefreshSoundPlayerRef>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        refetchOwner(),
        refetchTodayCheckins(),
      ]);
      // Play delightful refresh sound and haptics
      refreshSoundRef.current?.playSound();
    } catch (e) {
      console.log('Error refreshing home data:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh checkins whenever the home screen comes into focus (e.g., returning from QR scan)
  useFocusEffect(
    useCallback(() => {
      refetchTodayCheckins();
    }, [refetchTodayCheckins])
  );

  useEffect(() => {
    const loadClubData = async () => {
      try {
        let logoFromStorage: any = null;
        let cNameFromStorage: string | null = null;
        let oNameFromStorage: string | null = null;

        const savedData = await AsyncStorage.getItem('club_profile');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.image) logoFromStorage = parsedData.image;
          if (parsedData.logo) logoFromStorage = parsedData.logo;
          if (parsedData.clubName) cNameFromStorage = parsedData.clubName;
          if (parsedData.ownerName) oNameFromStorage = parsedData.ownerName;
        }

        const userKey = profileStatus?.id || profileStatus?.pendingClubOwnerId || user?.id || user?.email || '';
        const keys = await AsyncStorage.getAllKeys();
        const step1Keys = keys.filter((k) => k.includes('onboarding_step1_data'));
        let step1Key = userKey ? step1Keys.find((k) => k.includes(String(userKey))) : null;

        if (step1Key) {
          const step1Json = await AsyncStorage.getItem(step1Key);
          if (step1Json) {
            const parsedStep1 = JSON.parse(step1Json);
            if (!logoFromStorage) {
              logoFromStorage = parsedStep1.image || parsedStep1.logo || parsedStep1.logoUrl || parsedStep1.logoId;
            }
            if (!cNameFromStorage) {
              cNameFromStorage = parsedStep1.clubName || parsedStep1.name;
            }
            if (!oNameFromStorage) {
              oNameFromStorage = parsedStep1.ownerName;
            }
          }
        }

        const pData = profileStatus?.data || profileStatus || {};
        const rawLogo =
          myOwnerData?.logoUrl ||
          myOwnerData?.logo ||
          myOwnerData?.logo_url ||
          user?.clubOwnerDetail?.logoUrl ||
          user?.clubOwnerDetail?.logo ||
          user?.clubOwnerDetail?.logo_url ||
          user?.clubOwnerDetail?.clubLogo ||
          user?.clubOwnerDetail?.image ||
          user?.logoUrl ||
          user?.logo ||
          user?.logo_url ||
          pData?.clubOwnerDetail?.logoUrl ||
          pData?.clubOwnerDetail?.logo ||
          pData?.clubOwnerDetail?.logo_url ||
          pData?.clubOwnerDetail?.clubLogo ||
          pData?.logoUrl ||
          pData?.logo ||
          pData?.logo_url ||
          pData?.pendingClubOwner?.logoUrl ||
          pData?.pendingClubOwner?.logo ||
          profileStatus?.clubOwnerDetail?.logoUrl ||
          profileStatus?.clubOwnerDetail?.logo ||
          profileStatus?.logoUrl ||
          profileStatus?.logo ||
          logoFromStorage ||
          null;

        const finalLogoUri = getImageUriString(rawLogo);

        setProfileImageUri(finalLogoUri || null);
        setImageError(false);
        if (cNameFromStorage) setStoredClubName(cNameFromStorage);
        if (oNameFromStorage) setStoredOwnerName(oNameFromStorage);

        // Persist fresh profileStatus into club_profile for app restarts/re-logins
        const cNameApi =
          myOwnerData?.clubName ||
          user?.clubOwnerDetail?.clubName ||
          pData?.clubOwnerDetail?.clubName ||
          pData?.clubName ||
          pData?.club_name ||
          pData?.pendingClubOwner?.clubName;

        const oNameApi =
          myOwnerData?.ownerName ||
          user?.clubOwnerDetail?.ownerName ||
          pData?.clubOwnerDetail?.ownerName ||
          pData?.ownerName ||
          pData?.owner_name ||
          pData?.pendingClubOwner?.ownerName;

        if (cNameApi || oNameApi || finalLogoUri) {
          const updatedStorage = {
            ...(savedData ? JSON.parse(savedData) : {}),
            ...(cNameApi ? { clubName: cNameApi } : {}),
            ...(oNameApi ? { ownerName: oNameApi } : {}),
            ...(finalLogoUri ? { image: finalLogoUri, logo: finalLogoUri } : {}),
          };
          await AsyncStorage.setItem('club_profile', JSON.stringify(updatedStorage));
        }
      } catch (e) {
        console.log('Error loading club profile image in index:', e);
      }
    };

    loadClubData();
  }, [profileStatus, myOwnerData, user]);

  // Scroll Shared Value for Stacking Card Scroll Animation
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const getDisplayName = () => {
    const pData = profileStatus?.data || profileStatus || {};
    const rawName =
      myOwnerData?.ownerName ||
      myOwnerData?.owner_name ||
      user?.clubOwnerDetail?.ownerName ||
      user?.clubOwnerDetail?.name ||
      pData?.clubOwnerDetail?.ownerName ||
      pData?.ownerName ||
      pData?.owner_name ||
      pData?.pendingClubOwner?.ownerName ||
      pData?.pendingClubOwner?.owner_name ||
      profileStatus?.ownerName ||
      profileStatus?.owner_name ||
      storedOwnerName ||
      user?.username ||
      '';

    if (!rawName) return 'User';

    if (rawName.includes('@')) {
      const namePart = rawName.split('@')[0];
      const cleanedName = namePart
        .replace(/[0-9]/g, '')
        .replace(/[._-]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return cleanedName || 'User';
    }

    return rawName;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 16) return 'Good Afternoon';
    if (hour < 20) return 'Good Evening';
    return 'Good Night';
  };

  const ownerName = getDisplayName();
  const pData = profileStatus?.data || profileStatus || {};
  const clubName =
    myOwnerData?.clubName ||
    myOwnerData?.club_name ||
    user?.clubOwnerDetail?.clubName ||
    pData?.clubOwnerDetail?.clubName ||
    pData?.clubName ||
    pData?.club_name ||
    storedClubName ||
    'Fitfob fitness Club';
  const greeting = getGreeting();

  return (
    <Container style={{ paddingBottom: 0 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F6163C']}
            tintColor="#F6163C"
          />
        }
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 100 : 30 }}>
        <View style={{ paddingTop: Platform.OS === 'ios' ? 10 : 20 }}>
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <TouchableOpacity
                onPress={() => router.push('/clubProfile')}
                style={{
                  shadowColor: '#F6163C',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  elevation: 4,
                }}
                className="items-center justify-center rounded-full border-2 border-[#F6163C]/30 bg-red-50 p-0.5">
                <Image
                  className="h-14 w-14 rounded-full"
                  source={
                    profileImageUri && !imageError
                      ? { uri: profileImageUri }
                      : require('../../assets/images/fitfob_profile.png')
                  }
                  onError={() => setImageError(true)}
                  resizeMode={profileImageUri && !imageError ? 'cover' : 'contain'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/clubProfile')} className="ml-3 flex-1 justify-center">
                <Text className="text-[12px] font-medium text-slate-500" numberOfLines={1}>
                  Welcome to {clubName}
                </Text>
                <Text className="text-[18px] font-bold text-slate-900 leading-[24px]" numberOfLines={2}>
                  {greeting}, {ownerName}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => router.push('/notification')}
                style={{ elevation: 2 }}
                className="rounded-full border border-white bg-white p-2 shadow-sm">
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M6.95508 18.1195C7.35096 19.2153 8.57752 20 9.99852 20C11.4195 20 12.6461 19.2153 13.042 18.1195C12.1264 18.1937 11.1155 18.2326 9.99852 18.2326C8.88151 18.2326 7.8706 18.1937 6.95508 18.1195Z"
                    fill="#F6163C"
                  />
                  <Path
                    d="M11.3909 1.40357C11.293 0.711327 10.6973 0.198768 9.99817 0.205261C9.30231 0.207544 8.7116 0.715813 8.60547 1.40357C9.52485 1.21979 10.4715 1.21979 11.3909 1.40357Z"
                    fill="#F6163C"
                  />
                  <Path
                    d="M17.2596 11.0535C16.7412 10.4997 16.3194 9.86286 16.0118 9.16948C15.8657 8.7492 15.7441 8.32074 15.6477 7.88637C15.068 5.53222 14.1878 1.97272 9.99914 1.97272C5.81043 1.97272 4.93029 5.53222 4.35056 7.88637C4.25414 8.32078 4.13259 8.7492 3.98647 9.16948C3.6789 9.86286 3.25708 10.4997 2.7387 11.0535C2.07416 11.8418 1.38488 12.6618 1.19048 14.0404C1.0786 14.6282 1.24427 15.2347 1.6394 15.684C2.69982 16.9071 5.51352 17.5257 9.99914 17.5257C14.4847 17.5257 17.2984 16.9071 18.3589 15.684C18.754 15.2347 18.9196 14.6282 18.8078 14.0404C18.6134 12.6618 17.9241 11.8418 17.2596 11.0535ZM7.13207 4.66368C6.41417 5.58944 6.02888 6.98781 5.72347 8.22566C5.61419 8.72126 5.47354 9.20946 5.30248 9.68727C5.25911 9.80863 5.15314 9.89678 5.02591 9.91733C4.89869 9.93787 4.77036 9.88754 4.69103 9.78597C4.6117 9.6844 4.59391 9.54769 4.64463 9.42924C4.80287 8.98177 4.93356 8.52505 5.03595 8.06164C5.35974 6.74812 5.77085 5.26565 6.57359 4.2303C6.65044 4.12889 6.77586 4.07659 6.90202 4.09339C7.02814 4.1102 7.13553 4.19351 7.18311 4.31152C7.23073 4.42958 7.21125 4.56404 7.13207 4.66368ZM8.69729 3.56509C8.47358 3.63396 8.2582 3.72738 8.05503 3.84363C8.00143 3.87503 7.9404 3.89152 7.8783 3.89136C7.71834 3.89136 7.57828 3.78389 7.53688 3.62936C7.49549 3.47482 7.56301 3.31175 7.70157 3.23174C7.95035 3.08945 8.21429 2.97537 8.48841 2.8917C8.61009 2.85062 8.74452 2.87876 8.83947 2.96521C8.93443 3.05167 8.97504 3.18287 8.94549 3.30789C8.91593 3.43287 8.82094 3.53204 8.69729 3.56683V3.56509Z"
                    fill="#F6163C"
                  />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/chat')}
                className="rounded-full border border-slate-100 bg-white p-2 shadow-sm">
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M19.5108 0.000251349C19.447 -0.00174692 19.3833 0.00850037 19.3233 0.0304709L0.330049 7.33928C0.240635 7.3716 0.162285 7.42876 0.10419 7.50405C0.0460947 7.57934 0.0106643 7.66965 0.00205443 7.76438C-0.00655548 7.8591 0.0120128 7.95429 0.0555803 8.03883C0.0991478 8.12337 0.165909 8.19374 0.24803 8.24166L6.56155 12.0269C9.97937 8.65503 13.9999 5.99936 13.9999 5.99936C13.9999 5.99936 11.3458 10.0191 7.9754 13.4371L11.7678 19.7576C11.8159 19.8373 11.8854 19.902 11.9683 19.9444C12.0511 19.9867 12.1442 20.0051 12.237 19.9974C12.3298 19.9897 12.4185 19.9562 12.4933 19.9008C12.5681 19.8453 12.6259 19.77 12.6603 19.6835L19.9658 0.681057C19.995 0.606098 20.0058 0.52517 19.997 0.445183C19.9883 0.365196 19.9605 0.288504 19.9158 0.221593C19.8712 0.154681 19.811 0.0995562 19.7405 0.0608635C19.67 0.0221709 19.5912 0.00196818 19.5108 0.000251349Z"
                    fill="#F6163C"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

          {/* Monthly Earnings Card */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/payoutHistory')}>
            <LinearGradient
              colors={['#F6163C', '#FF8FA3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 2, y: 2 }}
              style={{ borderRadius: 16, overflow: 'hidden' }}
              className="relative mb-6 shadow-xl shadow-red-300">
              {/* Background Pattern Image */}
              <Image
                source={require('../../assets/images/bgLayer.png')}
                className="absolute right-0 top-0 h-full w-1/2"
                resizeMode="cover"
              />

              <View className="relative z-10 rounded-lg px-4 py-5">
                <View className="flex-row items-start justify-between">
                  <Text className="font-medium text-white/80">Monthly Earnings</Text>
                  <View className="flex-row items-center gap-1 rounded-full bg-[#0000001A] px-3 py-1.5 backdrop-blur-md">
                    <Ionicons name="arrow-up" size={15} color="#FFF" />

                    <Text className="font-bold text-[10px]  text-[#FFF]">+0% this month</Text>
                  </View>
                </View>
                <Text className="mt-2 font-bold text-4xl text-white">
                  {formatIndianCurrency(
                    pData?.monthlyEarnings ||
                    pData?.totalEarnings ||
                    pData?.earnings ||
                    0
                  )}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Stats Row */}
          <View className="mb-8 mt-4 flex-row justify-between">
            {/* Today's Check-ins Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/checkins')}
              style={styles.statsCardRed}
              className="mr-3 flex-1 rounded-[24px] overflow-hidden border border-red-100/80 bg-white">
              <LinearGradient
                colors={['#FFFFFF', '#FFF1F3', '#FFE4E8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Gym Watermark Background Icon */}
              <View style={styles.watermarkContainerRed}>
                <Ionicons name="barbell" size={90} color="#F6163C" style={{ opacity: 0.12, transform: [{ rotate: '-18deg' }] }} />
              </View>

              <View style={{ padding: 18 }} className="relative z-10">
                <View className="flex-row items-center gap-1.5 mb-2  ">
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-red-500/10">
                    <Ionicons name="flame" size={14} color="#F6163C" />
                  </View>
                  <Text className="font-semibold text-[12px] text-slate-600">Today's Check-ins</Text>
                </View>

                <View className="mt-1 flex-row items-end justify-between">
                  <Text className="font-extrabold text-3xl text-slate-900">
                    {formatIndianNumber(todayCheckinsCount)}
                  </Text>
                  {/* Green Pill Indicator - only shown when check-ins exist */}
                  {todayCheckinsCount > 0 && (
                    <View className="mb-1 flex-row items-center rounded-full bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20">
                      <Ionicons name="arrow-up" size={13} color="#10B981" />
                      <Text className="ml-0.5 font-bold text-[11px] text-emerald-600">
                        +{todayCheckinsCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Active Members Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/')}
              style={styles.statsCardPurple}
              className="flex-1 rounded-[24px] overflow-hidden border border-purple-100/80 bg-white">
              <LinearGradient
                colors={['#FFFFFF', '#F7F5FF', '#EDE7FE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Gym Watermark Background Icon */}
              <View style={styles.watermarkContainerPurple}>
                <Ionicons name="fitness" size={90} color="#7C3AED" style={{ opacity: 0.12, transform: [{ rotate: '15deg' }] }} />
              </View>

              <View style={{ padding: 18 }} className="relative z-10">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-purple-500/10">
                    <Ionicons name="people" size={14} color="#7C3AED" />
                  </View>
                  <Text className="font-semibold text-[12px] text-slate-600">Active Members</Text>
                </View>

                <View className="mt-1 flex-row items-end justify-between">
                  <Text className="font-extrabold text-3xl text-slate-900">0</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View className=" flex-row items-center justify-between">
            <Text className="font-bold text-lg text-slate-900">Recent Check-ins</Text>
            <TouchableOpacity onPress={() => router.push('/ViewAllScreen')}>
              <Text className="rounded-full bg-[#F6163C] px-4 py-2.5 font-normal leading-4 text-white">
                View All
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SCROLLABLE LIST / SKELETON / EMPTY STATE --- */}
        {isCheckinsLoading ? (
          <View className="mt-2 pb-6">
            <CheckinItemSkeleton />
            <CheckinItemSkeleton />
            <CheckinItemSkeleton />
          </View>
        ) : recentCheckins.length === 0 ? (
          <View className="items-center justify-center ">
            <Image
              source={require('../../assets/images/empty_checkins.png')}
              className="h-72 w-72"
              resizeMode="contain"
            />
            <Text className="mt-1 text-center font-bold text-lg text-slate-900">
              No Recent Check-ins Yet
            </Text>
            <Text className="mt-1 px-6 text-center text-[12px] leading-5 text-slate-500">
              When members check in to your gym, their live activity and details will appear right here.
            </Text>
          </View>
        ) : (
          <View className="mt-2 pb-6">
            {recentCheckins.map((item, index) => (
              <CheckinItem
                key={item.id || item.clientId || index}
                item={item}
                index={index}
                scrollY={scrollY}
                onSelect={(selected: any) => setSelectedMember({ ...selected, verified: true })}
              />
            ))}
          </View>
        )}
      </ScrollView>

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
                        : require('../../assets/images/fitfob_profile.png')
                    }
                    style={styles.largeAvatar}
                  />
                  <View style={styles.profileMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.profileName}>{selectedMember?.name || 'Member'}</Text>
                      {selectedMember?.verified && (
                        <Image
                          style={styles.checkIcon}
                          source={require('../../assets/images/tick.png')}
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
                            ? require('../../assets/images/luxury.png')
                            : selectedMember?.type === 'Premium'
                              ? require('../../assets/images/premium.png')
                              : require('../../assets/images/standardicon.png')
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
                      <Ionicons name="mail-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Email Address</Text>
                    </View>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {selectedMember?.clientEmail || selectedMember?.email || 'Not provided'}
                    </Text>
                  </View>

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

      {/* Invisible sound & haptics player for refresh action */}
      <RefreshSoundPlayer ref={refreshSoundRef} />
    </Container>
  );
};

const styles = StyleSheet.create({
  statsCardRed: {
    ...Platform.select({
      ios: {
        shadowColor: '#F6163C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statsCardPurple: {
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  watermarkContainerRed: {
    position: 'absolute',
    right: -15,
    bottom: -15,
  },
  watermarkContainerPurple: {
    position: 'absolute',
    right: -15,
    bottom: -15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
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
    marginLeft: 18,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginRight: 6,
  },
  checkIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  profileTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  detailsList: {
    gap: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#E8F8F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: 'bold',
  },
  footerBtns: {
    marginTop: 30,
  },
  primaryBtn: {
    backgroundColor: '#F6163C',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F6163C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default HomeScreen;

