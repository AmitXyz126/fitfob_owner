import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import LineGradient from '@/components/lineGradient/LineGradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserDetail } from '@/hooks/useUserDetail';

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

const GymBackgroundAnimation = () => {
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
};

const ClubProfileScreen = () => {
  const router = useRouter();

  // --- States for Dynamic Data ---
  const { user } = useAuthStore();
  const { profileStatus } = useUserDetail();

  const [clubInfo, setClubInfo] = useState({
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

  // --- Fetch Data from Onboarding ---
  useEffect(() => {
    const loadClubData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('club_profile');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setClubInfo({
            name: parsedData.clubName || 'Anytime Fitness Gym',
            image: parsedData.image || null,
            address: parsedData.address || '1234 Park Street, Mohali',
          });
        }
      } catch (error) {
        console.error('Failed to load club data', error);
      }
    };
    loadClubData();
  }, []);

  const MenuOption = ({
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
  );

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
            className=" justify-center p-4"
            resizeMode="cover">
            <View className="flex-row items-center">
              <View className="relative">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/EditClubDetails')}>
                  <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-white/50 bg-white/30">
                    <Image
                      // --- DYNAMIC IMAGE ---
                      source={
                        profileStatus?.logoUrl
                          ? { uri: profileStatus.logoUrl }
                          : require('../assets/images/fitfob_profile.png')
                      }
                      className="h-14 w-14 rounded-full"
                      resizeMode={profileStatus?.logoUrl ? 'cover' : 'contain'}
                    />

                    <View className="absolute bottom-0 right-0 rounded-full border border-white bg-[#F6163C] p-1">
                      <MaterialIcons name="edit" size={10} color="white" />
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity className="absolute -bottom-1 -right-1 rounded-full bg-white p-1.5 shadow-md">
                  <SquarePen size={14} color="#EF4444" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <View className="ml-4 flex-1">
                <View className="flex-row items-center">
                  {/* --- DYNAMIC NAME --- */}
                  <Text className="mr-2 font-bold text-xl text-white">{ownerName}</Text>
                  <Image className="h-5 w-5" source={require('../assets/images/white-tick.png')} />
                </View>
                <Text className="text-sm text-white/90">{ownerEmail}</Text>
              </View>
            </View>
            <View className="my-4">
              <LineGradient isWhite={true} />
            </View>
            <Text className="text-[14px] font-normal text-white">Gym, Yoga, Dance, Pilates</Text>
          </ImageBackground>
        </View>

        {/* Menu Section */}
        <View className="mb-16 rounded-3xl bg- px-4 py-2">
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
            onPress={() => router.push('/clubAmenities')}
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
