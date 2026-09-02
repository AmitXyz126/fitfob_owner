import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ImageBackground, Dimensions, Animated, Easing, StyleSheet } from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Image as ImageIcon,
  ShieldCheck,
  Clock,
  Wifi,
  Wallet,
  LogOut,
  SquarePen,
  FileText,
  Lock,
  Layers,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import LineGradient from '@/components/lineGradient/LineGradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserDetail, useClubOwnerMe } from '@/hooks/useUserDetail';
import { userDetailsApi } from '@/api/userdetailsApi';

const getServiceIcon = (name: string) => {
  const lower = String(name).toLowerCase();
  if (lower.includes('gym') || lower.includes('strength')) return 'barbell';
  if (lower.includes('yoga') || lower.includes('tai chi')) return 'body';
  if (lower.includes('dance') || lower.includes('salsa') || lower.includes('ballet') || lower.includes('barre')) return 'musical-notes';
  if (lower.includes('pilates')) return 'accessibility';
  if (lower.includes('zumba') || lower.includes('hiit') || lower.includes('cardio')) return 'flame';
  if (lower.includes('spin') || lower.includes('cycle')) return 'bicycle';
  if (lower.includes('box') || lower.includes('kick') || lower.includes('martial')) return 'fitness';
  if (lower.includes('aqua') || lower.includes('pool') || lower.includes('swim')) return 'water';
  if (lower.includes('cross') || lower.includes('climb')) return 'trophy';
  return 'sparkles';
};

const FitnessServicePills = memo(({ services }: { services?: any }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  let items = services;

  if (!items) return null;

  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [items];
    }
  }
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {items.map((item: string, idx: number) => {
        const iconName = getServiceIcon(item);
        return (
          <Animated.View
            key={`${item}-${idx}`}
            style={{
              transform: [{ scale: pulseAnim }],
            }}>
            <View className="flex-row items-center rounded-full border border-white/40 bg-white/25 px-3 py-1.5 backdrop-blur-md shadow-sm">
              <Ionicons name={iconName as any} size={14} color="#FFF" style={{ marginRight: 5 }} />
              <Text className="font-sans font-bold text-[12px] text-white tracking-wide">{item}</Text>
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
});

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FLOATING_ICONS = [
  'dumbbell',
  'kettlebell',
  'weight',
  'heart-flash',
  'run',
  'arm-flex',
  'trophy-outline',
  'clock-outline',
];

const PREMIUM_COLORS = [
  '#F6163C', // Brand Crimson
  '#FF7A00', // Premium Orange/Amber
  '#FFD700', // Gold
  '#10B981', // Energetic Green
  '#3B82F6', // Focus Blue
  '#8B5CF6', // Power Purple
];

const GymBackgroundAnimation = memo(() => {
  const items = useRef(
    Array.from({ length: 15 }).map((_, i) => {
      const boxSize = Math.random() * 20 + 64; // Larger random size from 64 to 84
      return {
        id: i,
        icon: FLOATING_ICONS[i % FLOATING_ICONS.length],
        color: PREMIUM_COLORS[i % PREMIUM_COLORS.length],
        boxSize: boxSize,
        iconSize: boxSize * 0.46,
        borderRadius: boxSize * 0.28,
        left: Math.random() * (SCREEN_WIDTH - 90),
        yAnim: new Animated.Value(SCREEN_HEIGHT + 100),
        rotAnim: new Animated.Value(0),
        swayAnim: new Animated.Value(0),
        opacityAnim: new Animated.Value(0),
        duration: Math.random() * 5000 + 13000, // 13s to 18s (staggered speed)
        delay: Math.random() * 5000,
      };
    })
  ).current;

  useEffect(() => {
    items.forEach((item) => {
      // Loop sequence
      const runCycle = (isFirstRun = false) => {
        item.yAnim.setValue(SCREEN_HEIGHT + 100);
        item.rotAnim.setValue(0);
        item.swayAnim.setValue(0);
        item.opacityAnim.setValue(0);

        Animated.sequence([
          isFirstRun ? Animated.delay(item.delay) : Animated.delay(0),
          Animated.parallel([
            // 1. Move Y (upwards)
            Animated.timing(item.yAnim, {
              toValue: -150,
              duration: item.duration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            // 2. Rotate continuously
            Animated.timing(item.rotAnim, {
              toValue: 360,
              duration: item.duration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            // 3. Opacity (fade in at bottom, stay constant, fade out at top)
            Animated.sequence([
              Animated.timing(item.opacityAnim, {
                toValue: 0.22, // Watermark peak opacity
                duration: item.duration * 0.15,
                useNativeDriver: true,
              }),
              Animated.delay(item.duration * 0.7),
              Animated.timing(item.opacityAnim, {
                toValue: 0,
                duration: item.duration * 0.15,
                useNativeDriver: true,
              }),
            ]),
            // 4. Sway left and right dynamically ("idr udr")
            Animated.sequence([
              Animated.timing(item.swayAnim, {
                toValue: Math.random() * 40 + 20, // Sway right
                duration: item.duration * 0.25,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(item.swayAnim, {
                toValue: -(Math.random() * 40 + 20), // Sway left
                duration: item.duration * 0.5,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(item.swayAnim, {
                toValue: 0,
                duration: item.duration * 0.25,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start(() => {
          // Restart loop immediately without delay on subsequent loops
          runCycle(false);
        });
      };

      runCycle(true);
    });
  }, [items]);

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: -1 }]} pointerEvents="none">
      {items.map((item) => {
        const spin = item.rotAnim.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.View
            key={item.id}
            style={{
              position: 'absolute',
              left: item.left,
              width: item.boxSize,
              height: item.boxSize,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [
                { translateY: item.yAnim },
                { translateX: item.swayAnim },
                { rotate: spin },
              ],
              opacity: item.opacityAnim,
            }}
          >
            <MaterialCommunityIcons name={item.icon as any} size={item.iconSize} color={item.color} />
          </Animated.View>
        );
      })}
    </View>
  );
});
const MenuOption = memo(({
  icon: Icon,
  title,
  value,
  showBadge = false,
  showArrow = true,
  onPress,
}: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    className="flex-row items-center justify-between py-4">
    <View className="flex-1 flex-row items-center">
      <View className="mr-4 rounded-xl bg-[#E237441F] p-2">
        <Icon size={20} color="#EF4444" />
      </View>
      <Text className="flex-1 font-medium text-base text-[#697281]" numberOfLines={1}>
        {title}
      </Text>
    </View>

    <View className="flex-row items-center">
      {value && <Text className="mr-2 text-sm text-gray-400">{value}</Text>}
      {showBadge && (
        <View className="mr-1">
          <Image
            source={require('../assets/images/tick.png')}
            className="h-6 w-6"
            resizeMode="contain"
          />
        </View>
      )}
      {showArrow && <ChevronRight size={20} color="#6B7280" />}
    </View>
  </TouchableOpacity>
));

const ClubProfileScreen = () => {
  const router = useRouter();

  // --- States for Dynamic Data ---
  const { user } = useAuthStore();
  const { profileStatus } = useUserDetail();
  const { data: myOwnerData } = useClubOwnerMe();

  const [clubInfo, setClubInfo] = useState<{
    name: string;
    image: string | null;
    address: string;
  }>({
    name: 'Loading...',
    image: null,
    address: 'Fetching address...',
  });

  const getDisplayName = () => {
    const rawName = profileStatus?.ownerName || user?.username || 'User';
    const namePart = rawName.includes('@') ? rawName.split('@')[0] : rawName;
    if (/^\+?[0-9]+$/.test(namePart)) {
      return 'User';
    }
    const cleanedName = namePart
      .replace(/[0-9]/g, '')
      .replace(/[._-]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return cleanedName || 'User';
  };

  const ownerName = getDisplayName();
  const ownerEmail = user?.email || profileStatus?.email || 'owner@fitfob.com';

  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [servicesList, setServicesList] = useState<string[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<string[]>([]);
  const [clubCategory, setClubCategory] = useState<string>('');

  const parseArrayData = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item).trim()).filter(Boolean);
          }
        } catch (e) {
          // fallback
        }
      }
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  };

  const getImageUriString = (val: any): string => {
    if (!val) return '';
    let str = '';
    if (typeof val === 'string') {
      str = val;
    } else if (typeof val === 'object') {
      str = val.uri || val.url || val.path || val.src || '';
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

  // --- Fetch Data from React Query Cached Hook ---
  useEffect(() => {
    const loadClubData = async () => {
      try {
        let logoFromStorage: any = null;
        let addressFromStorage: string | null = null;
        let clubNameFromStorage: string | null = null;
        let servicesFromStorage: string[] = [];
        let amenitiesFromStorage: string[] = [];
        let categoryFromStorage: string = '';

        const savedData = await AsyncStorage.getItem('club_profile');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.image) logoFromStorage = parsedData.image;
          if (parsedData.logo) logoFromStorage = parsedData.logo;
          if (parsedData.address) addressFromStorage = parsedData.address;
          if (parsedData.clubName) clubNameFromStorage = parsedData.clubName;
          if (parsedData.services) servicesFromStorage = parseArrayData(parsedData.services);
          if (parsedData.amenities) amenitiesFromStorage = parseArrayData(parsedData.amenities);
          if (parsedData.clubCategory) categoryFromStorage = parsedData.clubCategory;
        }

        const keys = await AsyncStorage.getAllKeys();

        // Step 1
        const step1Keys = keys.filter((k) => k.includes('onboarding_step1_data'));
        if (step1Keys.length > 0) {
          const lastStep1Key = step1Keys[step1Keys.length - 1];
          const step1Json = await AsyncStorage.getItem(lastStep1Key);
          if (step1Json) {
            const parsedStep1 = JSON.parse(step1Json);
            if (!logoFromStorage) {
              logoFromStorage = parsedStep1.image || parsedStep1.logo || parsedStep1.logoUrl || parsedStep1.logoId;
            }
            if (!clubNameFromStorage) {
              clubNameFromStorage = parsedStep1.clubName || parsedStep1.name;
            }
          }
        }

        // Step 3 (Services & Amenities)
        const step3Keys = keys.filter((k) => k.includes('onboarding_step3_data'));
        if (step3Keys.length > 0) {
          const lastStep3Key = step3Keys[step3Keys.length - 1];
          const step3Json = await AsyncStorage.getItem(lastStep3Key);
          if (step3Json) {
            const parsedStep3 = JSON.parse(step3Json);
            if (servicesFromStorage.length === 0) {
              servicesFromStorage = parseArrayData(parsedStep3.fitnessTypes || parsedStep3.services);
            }
            if (amenitiesFromStorage.length === 0) {
              amenitiesFromStorage = parseArrayData(parsedStep3.amenities || parsedStep3.facilities);
            }
            if (!categoryFromStorage) {
              categoryFromStorage = parsedStep3.clubCategory || '';
            }
          }
        }

        const pData = myOwnerData || profileStatus?.data || profileStatus || {};

        // Resolve Logo Image
        const rawLogo =
          myOwnerData?.logoUrl ||
          myOwnerData?.logo ||
          myOwnerData?.logo_url ||
          myOwnerData?.image ||
          user?.clubOwnerDetail?.logoUrl ||
          user?.clubOwnerDetail?.logo ||
          user?.clubOwnerDetail?.image ||
          user?.logoUrl ||
          user?.logo ||
          pData?.clubOwnerDetail?.logoUrl ||
          pData?.clubOwnerDetail?.logo ||
          pData?.logoUrl ||
          pData?.logo ||
          pData?.pendingClubOwner?.logoUrl ||
          pData?.pendingClubOwner?.logo ||
          logoFromStorage ||
          null;

        const finalLogoUri = getImageUriString(rawLogo);

        setProfileImageUri(finalLogoUri || null);
        setImageError(false);

        // Resolve Services
        const rawServices =
          myOwnerData?.services ||
          myOwnerData?.fitnessTypes ||
          pData?.services ||
          pData?.fitnessTypes ||
          pData?.pendingClubOwner?.services ||
          pData?.pendingClubOwner?.fitnessTypes ||
          user?.clubOwnerDetail?.services ||
          user?.clubOwnerDetail?.fitnessTypes ||
          servicesFromStorage;

        const resolvedServices = parseArrayData(rawServices);
        setServicesList(resolvedServices.length > 0 ? resolvedServices : servicesFromStorage);

        // Resolve Amenities
        const rawAmenities =
          myOwnerData?.facilities ||
          myOwnerData?.amenities ||
          pData?.facilities ||
          pData?.amenities ||
          pData?.pendingClubOwner?.facilities ||
          pData?.pendingClubOwner?.amenities ||
          user?.clubOwnerDetail?.facilities ||
          user?.clubOwnerDetail?.amenities ||
          amenitiesFromStorage;

        const resolvedAmenities = parseArrayData(rawAmenities);
        setAmenitiesList(resolvedAmenities.length > 0 ? resolvedAmenities : amenitiesFromStorage);

        // Resolve Club Category
        const resolvedCategory =
          myOwnerData?.clubCategory ||
          myOwnerData?.category ||
          pData?.clubCategory ||
          pData?.category ||
          pData?.pendingClubOwner?.clubCategory ||
          user?.clubOwnerDetail?.clubCategory ||
          categoryFromStorage ||
          '';

        setClubCategory(resolvedCategory);

        // Resolve Club Name & Address
        const resolvedClubName =
          myOwnerData?.clubName ||
          myOwnerData?.name ||
          pData?.clubName ||
          pData?.club_name ||
          pData?.pendingClubOwner?.clubName ||
          clubNameFromStorage ||
          'Fitness Club';

        const resolvedAddress =
          myOwnerData?.clubAddress ||
          myOwnerData?.address ||
          pData?.clubAddress ||
          addressFromStorage ||
          'Your Club Location';

        setClubInfo({
          name: resolvedClubName,
          image: finalLogoUri,
          address: resolvedAddress,
        });
      } catch (error) {
        console.error('Failed to load club profile data:', error);
      }
    };
    loadClubData();
  }, [myOwnerData, profileStatus, user]);

  return (
    <Container>
      <GymBackgroundAnimation />
      {/* Header */}
      <View className="relative mb-4 flex-row items-center py-4">
        <TouchableOpacity onPress={() => router.back()} className="absolute left-0 z-10 p-2">
          <ChevronLeft color="black" size={24} />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-center font-medium font-sans text-base text-[#697281]">
            Club Profile
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View className="mb-2 overflow-hidden rounded-[16px]">
          <ImageBackground
            source={require('../assets/images/bgprofile.png')}
            className="justify-center p-4"
            fadeDuration={0}
            resizeMode="cover">
            <View className="flex-row items-center">
              <View className="relative">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/EditClubDetails')}>
                  <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-white/50 bg-white/30">
                    <Image
                      // --- DYNAMIC IMAGE WITH FALLBACK ON ERROR ---
                      source={
                        profileImageUri && !imageError
                          ? { uri: profileImageUri }
                          : require('../assets/images/fitfob_profile.png')
                      }
                      fadeDuration={0}
                      onError={() => setImageError(true)}
                      className="h-14 w-14 rounded-full"
                      resizeMode={profileImageUri && !imageError ? 'cover' : 'contain'}
                    />

                    <View className="absolute bottom-0 right-0 rounded-full border border-white bg-[#F6163C] p-1">
                      <MaterialIcons name="edit" size={10} color="white" />
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/EditClubDetails')}
                  className="absolute -bottom-1 -right-1 rounded-full bg-white p-1.5 shadow-md">
                  <SquarePen size={14} color="#EF4444" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <View className="ml-4 flex-1">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    {/* --- DYNAMIC NAME --- */}
                    <Text className="mr-2 font-bold text-xl text-white">{ownerName}</Text>
                    <Image className="h-5 w-5" source={require('../assets/images/white-tick.png')} />
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/EditClubDetails')}
                    className="flex-row items-center rounded-full bg-white/20 px-3 py-1 border border-white/30">
                    <SquarePen size={12} color="#FFF" style={{ marginRight: 4 }} />
                    <Text className="font-semibold text-[11px] text-white">Edit Details</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-white/90">{ownerEmail}</Text>
              </View>
            </View>
            <View className="my-3">
              <LineGradient isWhite={true} />
            </View>
            <FitnessServicePills services={servicesList} />
          </ImageBackground>
        </View>

        {/* Menu Section */}
        <View className="mb-16 rounded-3xl  px-4 py-2">
          {/* --- DYNAMIC ADDRESS --- */}
          <MenuOption
            onPress={() => router.push('/ClubLocationScreen')}
            icon={MapPin}
            title={clubInfo.address}
          />
          <LineGradient />

          <MenuOption
            icon={ImageIcon}
            title="Club Photos"
            onPress={() => router.push('/ClubPhotosScreen')}
          />
          <LineGradient />

          <MenuOption
            icon={ShieldCheck}
            title="Verification Status"
            showBadge={true}
            showArrow={true}
            onPress={() => router.push('/verificationStatus')}
          />
          <LineGradient />

          <MenuOption
            icon={FileText}
            title="Documents"
            onPress={() => router.push('/documents')}
          />
          <LineGradient />
          <MenuOption
            icon={Clock}
            title="Timings"
            onPress={() => router.push('/clubTimings')}
          />
          <LineGradient />

          <MenuOption
            icon={Wifi}
            title="Amenities"
            value={amenitiesList.length > 0 ? `${amenitiesList.length} Active` : undefined}
            onPress={() => router.push('/clubAmenities')}
          />
          <LineGradient />

          <MenuOption
            icon={Layers}
            title="Club Types & Services"
            value={
              clubCategory
                ? `${clubCategory} • ${servicesList.length} Services`
                : servicesList.length > 0
                ? `${servicesList.length} Services`
                : undefined
            }
            onPress={() => router.push('/clubServices')}
          />
          <LineGradient />

          <MenuOption
            icon={Wallet}
            title="Your Account"
            onPress={() => router.push('/ManageBankScreen')}
          />
          <LineGradient />

          <MenuOption
            icon={Lock}
            title="Change Password"
            onPress={() => router.push('/ChangePasswordScreen')}
          />
        </View>
      </ScrollView>

      {/* Logout Button (Fixed at bottom) */}
      <View className="bg-white py-4 border-t border-slate-50">
        <TouchableOpacity
          onPress={async () => {
            await useAuthStore.getState().logOut();
            await AsyncStorage.clear();
            if (router.canGoBack()) {
              router.dismissAll();
            }
            router.replace('/welcome');
          }}
          className="flex-row items-center justify-center rounded-[8px] bg-[#F8F8F8] py-4">
          <LogOut size={20} color="#94A3B8" />
          <Text className="ml-2 font-bold text-base text-gray-400">Logout</Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
};

export default ClubProfileScreen;
