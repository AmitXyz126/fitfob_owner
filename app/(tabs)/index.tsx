/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Modal, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useUserDetail, useClubOwnerMe } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
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

// DUMMY RECENT CHECKINS DATA (COMMENTED OUT FOR LIVE DATA / EMPTY STATE)
/*
const DUMMY_RECENT_CHECKINS = [
  {
    id: '1',
    name: 'Tina Sharma',
    time: '10 mins ago',
    type: 'Standard',
    image: 'https://i.pravatar.cc/150?u=tina',
    color: '#94A3B8',
  },
  {
    id: '2',
    name: 'Amelia Thomas',
    time: '1 hr ago',
    type: 'Premium',
    image: 'https://i.pravatar.cc/150?u=amelia',
    color: '#EAB308',
  },
  {
    id: '3',
    name: 'Sophia Lee',
    time: '35 mins ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=sophia',
    color: '#F6163C',
  },
  {
    id: '4',
    name: 'Liam Brown',
    time: '20 mins ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=liam',
    color: '#F6163C',
  },
  {
    id: '5',
    name: 'Rahul Dev',
    time: '45 mins ago',
    type: 'Standard',
    image: 'https://i.pravatar.cc/150?u=rahul',
    color: '#94A3B8',
  },
  {
    id: '6',
    name: 'Zoya Khan',
    time: '50 mins ago',
    type: 'Premium',
    image: 'https://i.pravatar.cc/150?u=zoya',
    color: '#EAB308',
  },
];
*/

const RECENT_CHECKINS: any[] = [];

const ITEM_SIZE = 84;

const CheckinItem = ({ item, index, scrollY, onSelect }: any) => {
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

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelect(item)}
        className="mb-3 flex-row items-center rounded-2xl border border-slate-100 bg-white p-3">
        <Image source={{ uri: item.image }} className="h-14 w-14 rounded-xl" />

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
  const { user } = useAuthStore();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [storedClubName, setStoredClubName] = useState<string>('');
  const [storedOwnerName, setStoredOwnerName] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        refetchOwner(),
      ]);
    } catch (e) {
      console.log('Error refreshing home data:', e);
    } finally {
      setRefreshing(false);
    }
  };

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
                <Ionicons name="notifications" size={20} color="#F6163C" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/chat')}
                className="rounded-full border border-slate-100 bg-white p-2 shadow-sm">
                <Ionicons name="paper-plane" size={20} color="#F6163C" />
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

                    <Text className="font-bold text-[10px]  text-[#FFF]">+20% this month</Text>
                  </View>
                </View>
                <Text className="mt-2 font-bold text-4xl text-white">
                  {formatIndianCurrency(
                    pData?.monthlyEarnings ||
                    pData?.totalEarnings ||
                    pData?.earnings ||
                    22220
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
                style={StyleSheet.absoluteFillObject}
              />

              {/* Gym Watermark Background Icon */}
              <View style={styles.watermarkContainerRed}>
                <Ionicons name="barbell" size={90} color="#F6163C" style={{ opacity: 0.12, transform: [{ rotate: '-18deg' }] }} />
              </View>

              <View style={{ padding: 18 }} className="relative z-10">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-red-500/10">
                    <Ionicons name="flame" size={14} color="#F6163C" />
                  </View>
                  <Text className="font-semibold text-[12px] text-slate-600">Today's Check-ins</Text>
                </View>

                <View className="mt-1 flex-row items-end justify-between">
                  <Text className="font-extrabold text-3xl text-slate-900">0</Text>
                  {/* Green Pill Indicator */}
                  <View className="mb-1 flex-row items-center rounded-full bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20">
                    <Ionicons name="arrow-up" size={13} color="#10B981" />
                    <Text className="ml-0.5 font-bold text-[11px] text-emerald-600">+5</Text>
                  </View>
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
                style={StyleSheet.absoluteFillObject}
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
                  {/* Green Pill Indicator */}
                  <View className="mb-1 flex-row items-center rounded-full bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20">
                    <Ionicons name="arrow-up" size={13} color="#10B981" />
                    <Text className="ml-0.5 font-bold text-[11px] text-emerald-600">+5</Text>
                  </View>
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

        {/* --- SCROLLABLE LIST WITH STACKING CARD SCROLL ANIMATION / EMPTY STATE --- */}
        {RECENT_CHECKINS.length === 0 ? (
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
          <Animated.FlatList
            data={RECENT_CHECKINS}
            keyExtractor={(item) => item.id}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: Platform.OS === 'ios' ? 100 : 20,
            }}
            renderItem={({ item, index }) => (
              <CheckinItem
                item={item}
                index={index}
                scrollY={scrollY}
                onSelect={(selected: any) => setSelectedMember({ ...selected, verified: true })}
              />
            )}
          />
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
                  <Image source={{ uri: selectedMember?.image }} style={styles.largeAvatar} />
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

                {/* Detailed Parameters */}
                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="card-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Member ID</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      FF-MEMBER-00{selectedMember?.id || '0'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="mail-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Email Address</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {selectedMember?.name?.toLowerCase().replace(/\s+/g, '') || 'member'}
                      @gmail.com
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="phone-portrait-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Phone Number</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      +91 98765 {43210 + (parseInt(selectedMember?.id || '1') || 1)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="calendar-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Renewal Date</Text>
                    </View>
                    <Text style={styles.detailValue}>15 Dec 2026</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                      <Text style={[styles.detailLabel, { color: '#10B981', fontWeight: 'bold' }]}>
                        Status
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Active</Text>
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

