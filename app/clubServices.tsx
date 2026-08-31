import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/Container';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';

interface MasterService {
  id: string;
  title: string;
  aliases: string[];
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

interface ServiceItem extends MasterService {
  isEnabled: boolean;
}

// EXACT 18 Fitness Services matching Onboarding Step 3
const MASTER_SERVICES: MasterService[] = [
  {
    id: 'Gym',
    title: 'Gym',
    aliases: ['gym', 'fitness center', 'weight room', 'gymnasium'],
    description: 'State-of-the-art strength, weight lifting & cardio machines.',
    iconName: 'barbell-outline',
  },
  {
    id: 'Yoga',
    title: 'Yoga',
    aliases: ['yoga', 'hatha yoga', 'vinyasa yoga', 'meditation'],
    description: 'Hatha, Vinyasa, Power yoga and meditation sessions.',
    iconName: 'body-outline',
  },
  {
    id: 'Dance',
    title: 'Dance',
    aliases: ['dance', 'dance fitness', 'zumba dance', 'freestyle dance'],
    description: 'Freestyle, Bollywood, and choreo dance classes.',
    iconName: 'musical-notes-outline',
  },
  {
    id: 'Pilates',
    title: 'Pilates',
    aliases: ['pilates', 'mat pilates', 'reformer pilates'],
    description: 'Mat and reformer pilates for core strength & flexibility.',
    iconName: 'accessibility-outline',
  },
  {
    id: 'Kickboxing',
    title: 'Kickboxing',
    aliases: ['kickboxing', 'kick boxing', 'combat fitness'],
    description: 'High-intensity kickboxing and combat conditioning.',
    iconName: 'fitness-outline',
  },
  {
    id: 'Zumba',
    title: 'Zumba',
    aliases: ['zumba', 'zumba fitness', 'latin dance'],
    description: 'High-energy Latin and world rhythm cardio dance.',
    iconName: 'flame-outline',
  },
  {
    id: 'Spin',
    title: 'Spin',
    aliases: ['spin', 'spin studio', 'indoor cycling', 'cycling'],
    description: 'Indoor cycling and high-energy spin workout sessions.',
    iconName: 'bicycle-outline',
  },
  {
    id: 'Barre',
    title: 'Barre',
    aliases: ['barre', 'barre workout', 'isometric holds'],
    description: 'Ballet-inspired conditioning and isometric holds.',
    iconName: 'body-outline',
  },
  {
    id: 'Aqua Aerobics',
    title: 'Aqua Aerobics',
    aliases: ['aqua aerobics', 'aqua fitness', 'pool workout', 'water aerobics'],
    description: 'Low-impact water aerobics and pool workouts.',
    iconName: 'water-outline',
  },
  {
    id: 'Martial Arts',
    title: 'Martial Arts',
    aliases: ['martial arts', 'karate', 'taekwondo', 'self defense'],
    description: 'Taekwondo, Karate, and self-defense training.',
    iconName: 'fitness-outline',
  },
  {
    id: 'Salsa',
    title: 'Salsa',
    aliases: ['salsa', 'salsa dance', 'latin dance'],
    description: 'Salsa partner and solo dance fitness.',
    iconName: 'musical-notes-outline',
  },
  {
    id: 'Strength Training',
    title: 'Strength Training',
    aliases: ['strength training', 'strength', 'heavy lifting', 'powerlifting'],
    description: 'Heavy lifting, powerlifting, and targeted muscle building.',
    iconName: 'barbell-outline',
  },
  {
    id: 'CrossFit',
    title: 'CrossFit',
    aliases: ['crossfit', 'cross fit', 'functional training', 'wod'],
    description: 'Functional high-intensity movements and WOD workouts.',
    iconName: 'trophy-outline',
  },
  {
    id: 'Tai Chi',
    title: 'Tai Chi',
    aliases: ['tai chi', 'taichi', 'mindful movement'],
    description: 'Mindful slow-movement and balance training.',
    iconName: 'body-outline',
  },
  {
    id: 'Boxing',
    title: 'Boxing',
    aliases: ['boxing', 'boxing bag', 'sparring', 'box fitness'],
    description: 'Boxing bag work, footwork, and sparring training.',
    iconName: 'fitness-outline',
  },
  {
    id: 'HIIT',
    title: 'HIIT',
    aliases: ['hiit', 'high intensity interval training', 'circuit training'],
    description: 'High-intensity interval training for fast calorie burn.',
    iconName: 'flame-outline',
  },
  {
    id: 'Ballet',
    title: 'Ballet',
    aliases: ['ballet', 'ballet dance', 'ballet technique'],
    description: 'Classic ballet technique, flexibility and posture.',
    iconName: 'accessibility-outline',
  },
  {
    id: 'Climbing',
    title: 'Climbing',
    aliases: ['climbing', 'bouldering', 'wall climbing', 'rock climbing'],
    description: 'Bouldering and indoor wall climbing conditioning.',
    iconName: 'trophy-outline',
  },
];

export default function ClubServicesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profileStatus, updateClubOwner, refetch } = useUserDetail();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initializeServices = async () => {
      let userSelected: string[] = [];

      // 1. Extract selected services from profileStatus / getMe backend data
      const pData = profileStatus?.data || profileStatus || {};
      const rawServices =
        pData?.services ||
        pData?.fitnessTypes ||
        pData?.pendingClubOwner?.services ||
        pData?.pendingClubOwner?.fitnessTypes;

      if (rawServices) {
        if (typeof rawServices === 'string') {
          try {
            userSelected = JSON.parse(rawServices);
          } catch {
            userSelected = [rawServices];
          }
        } else if (Array.isArray(rawServices)) {
          userSelected = rawServices;
        }
      }

      // 2. Local Storage Fallback if backend data is not populated yet
      try {
        const savedProfile = await AsyncStorage.getItem('club_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed.services && Array.isArray(parsed.services) && userSelected.length === 0) {
            userSelected = parsed.services;
          }
        }

        const userKey = profileStatus?.id || profileStatus?.pendingClubOwnerId || user?.id || user?.email || 'guest';
        const step3StorageKey = `@onboarding_step3_data_${userKey}`;
        const savedStep3 = await AsyncStorage.getItem(step3StorageKey);
        if (savedStep3 && userSelected.length === 0) {
          const parsedStep3 = JSON.parse(savedStep3);
          if (parsedStep3.fitnessTypes && Array.isArray(parsedStep3.fitnessTypes)) {
            userSelected = parsedStep3.fitnessTypes;
          } else if (parsedStep3.services && Array.isArray(parsedStep3.services)) {
            userSelected = parsedStep3.services;
          }
        }
      } catch (e) {
        console.log('Error reading local services draft:', e);
      }

      // 3. Map MASTER_SERVICES with boolean flags
      const mappedList: ServiceItem[] = MASTER_SERVICES.map((item) => {
        const isMatched = userSelected.some((userItem: string) => {
          const cleanUserItem = String(userItem).toLowerCase().trim();
          const cleanTitle = item.title.toLowerCase().trim();
          const cleanId = item.id.toLowerCase().trim();
          return (
            cleanUserItem === cleanTitle ||
            cleanUserItem === cleanId ||
            item.aliases.some((alias) => alias.toLowerCase() === cleanUserItem)
          );
        });

        return {
          ...item,
          isEnabled: isMatched,
        };
      });

      setServices(mappedList);
    };

    initializeServices();
  }, [profileStatus, user]);

  const handleToggle = (id: string) => {
    setServices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isEnabled: !item.isEnabled } : item))
    );
  };

  const handleSave = async () => {
    const enabledTitles = services.filter((item) => item.isEnabled).map((item) => item.title);

    if (enabledTitles.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please select at least one fitness service.',
      });
      return;
    }

    try {
      setIsSaving(true);

      // Save locally to AsyncStorage
      const saved = await AsyncStorage.getItem('club_profile');
      const parsed = saved ? JSON.parse(saved) : {};
      const updated = {
        ...parsed,
        services: enabledTitles,
        fitnessTypes: enabledTitles,
      };
      await AsyncStorage.setItem('club_profile', JSON.stringify(updated));

      const userKey = profileStatus?.id || profileStatus?.pendingClubOwnerId || user?.id || user?.email || 'guest';
      const step3StorageKey = `@onboarding_step3_data_${userKey}`;
      await AsyncStorage.setItem(
        step3StorageKey,
        JSON.stringify({
          services: enabledTitles,
          fitnessTypes: enabledTitles,
        })
      );

      // Save to backend via updateClubOwner mutation
      await updateClubOwner.mutateAsync({
        services: enabledTitles,
        fitnessTypes: enabledTitles,
      });

      refetch();

      Toast.show({
        type: 'success',
        text1: 'Services Updated! 🏋️‍♂️',
        text2: 'Club fitness types updated successfully.',
      });

      router.back();
    } catch (error: any) {
      console.log('Error saving services:', error?.response?.data || error?.message);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error?.response?.data?.message || 'Failed to update club services.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderServiceItem = ({ item }: { item: ServiceItem }) => (
    <View className="mb-3 flex-row items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <View className="flex-row items-center flex-1 pr-4">
        {/* Icon Badge */}
        <View className="h-12 w-12 items-center justify-center rounded-[10px] bg-[#FFF0F2]">
          <Ionicons name={item.iconName} size={22} color="#F6163C" />
        </View>

        {/* Info */}
        <View className="ml-3 flex-1">
          <Text className="font-sans font-bold text-[15px] leading-tight text-[#1C1C1C]">
            {item.title}
          </Text>
          <Text className="font-sans text-[11px] font-medium text-slate-400 mt-1 leading-snug">
            {item.description}
          </Text>
        </View>
      </View>

      {/* Toggle switch */}
      <Switch
        value={item.isEnabled}
        onValueChange={() => handleToggle(item.id)}
        trackColor={{ false: '#E2E8F0', true: '#4ADE80' }}
        thumbColor={'white'}
      />
    </View>
  );

  return (
    <Container>
      {/* Header */}
      <View className="flex-row items-center justify-between py-3 mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100">
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-sans font-bold text-[18px] text-[#1C1C1C] text-center flex-1 mr-10">
          Club Fitness Types & Services
        </Text>
      </View>

      {/* Main List */}
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Bottom Save Button */}
      <View className="absolute bottom-6 left-4 right-4 bg-white py-2">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
          className="flex-row items-center justify-center rounded-2xl bg-[#F6163C] py-4 shadow-md">
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFF" />
              <Text className="font-sans font-bold text-[16px] text-white ml-2">
                Save Fitness Services
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Container>
  );
}
