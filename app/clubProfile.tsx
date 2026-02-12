import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
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
  Bell,
  SquarePen,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import LineGradient from '@/components/lineGradient/LineGradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const ClubProfileScreen = () => {
  const router = useRouter();

  // --- States for Dynamic Data ---
  const [clubInfo, setClubInfo] = useState({
    name: 'Loading...',
    image: null,
    address: 'Fetching address...',
  });

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
        <View className="mr-4 rounded-xl bg-red-50 p-2">
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
      {/* Header */}
      <View className="flex-row items-center justify-between py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="black" size={24} />
        </TouchableOpacity>
        <Text className="font-bold text-lg text-gray-500">Club Profile</Text>
        <TouchableOpacity>
          <Bell color="#EF4444" size={24} fill="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View className="mb-6 overflow-hidden rounded-[16px]">
          <ImageBackground
            source={require('../assets/images/bgprofile.png')}
            className="min-h-[170px] justify-center p-5"
            resizeMode="cover">
            <View className="flex-row items-center">
              <View className="relative">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/EditClubDetails')} // <-- Yahan click karne par navigation hoga
                >
                  <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-white/50 bg-white/30">
                    <Image
                      // --- DYNAMIC IMAGE ---
                      source={
                        clubInfo.image
                          ? { uri: clubInfo.image }
                          : { uri: 'https://i.pravatar.cc/100?u=fitness' }
                      }
                      className="h-14 w-14 rounded-full"
                    />

                    {/* Chota camera icon overlay (optional, design ke liye) */}
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
                  <Text className="mr-2 font-bold text-xl text-white">{clubInfo.name}</Text>
                  <Image className="h-5 w-5" source={require('../assets/images/white-tick.png')} />
                </View>
                <Text className="text-sm text-white/90">anytimefitnessgym@gmail.com</Text>
              </View>
            </View>
            <View className="my-4">
              <LineGradient isWhite={true} />
            </View>
            <Text className="text-[14px] font-normal text-white">Gym, Yoga, Dance, Pilates</Text>
          </ImageBackground>
        </View>

        {/* Menu Section */}
        <View className="rounded-3xl bg-white px-4 py-2">
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
            showArrow={false}
          />
          <LineGradient />

          <MenuOption icon={Clock} title="Timings" />
          <LineGradient />

          <MenuOption icon={Wifi} title="Amenities" />
          <LineGradient />

          <MenuOption
            icon={Wallet}
            title="Your Account"
            onPress={() => router.push('/ManageBankScreen')}
          />
        </View>

        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.clear();
            router.replace('../../');
          }}
          className="mb-10 mt-8 flex-row items-center justify-center rounded-2xl bg-gray-50 py-4">
          <LogOut size={20} color="#94A3B8" />
          <Text className="ml-2 font-bold text-base text-gray-400">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
};

export default ClubProfileScreen;
