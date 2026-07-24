import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/Container';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserDetail } from '@/hooks/useUserDetail';

interface MasterAmenity {
  id: string;
  title: string;
  aliases: string[];
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

interface AmenityItem extends MasterAmenity {
  isEnabled: boolean;
}

// EXACT 17 Amenities & Titles matching Onboarding Step 3
const MASTER_AMENITIES: MasterAmenity[] = [
  {
    id: 'Bar',
    title: 'Bar',
    aliases: ['bar', 'lounge bar', 'juice bar'],
    description: 'Refreshing drinks, shakes, and lounge area.',
    iconName: 'beer-outline',
  },
  {
    id: 'Pet-Friendly',
    title: 'Pet-Friendly',
    aliases: ['pet-friendly', 'pet friendly', 'pets allowed'],
    description: 'Pet-friendly facilities allowing members to bring pets.',
    iconName: 'paw-outline',
  },
  {
    id: '24-Hour Reception',
    title: '24-Hour Reception',
    aliases: ['24-hour reception', '24/7 reception', '24/7 front desk', 'reception'],
    description: '24/7 front desk support and assistance.',
    iconName: 'time-outline',
  },
  {
    id: 'Parking',
    title: 'Parking',
    aliases: ['parking', 'free parking', 'valet parking'],
    description: 'Dedicated car and bike parking space for members.',
    iconName: 'car-outline',
  },
  {
    id: 'Wi-Fi',
    title: 'Wi-Fi',
    aliases: ['wi-fi', 'wifi', 'internet', 'free high-speed wi-fi'],
    description: 'Complimentary high-speed internet throughout.',
    iconName: 'wifi',
  },
  {
    id: 'AC',
    title: 'AC',
    aliases: ['ac', 'air conditioning', 'climate control'],
    description: 'Fully centralized climate control across all zones.',
    iconName: 'snow-outline',
  },
  {
    id: 'Breakfast',
    title: 'Breakfast',
    aliases: ['breakfast', 'cafe', 'juice bar', 'breakfast & café'],
    description: 'Protein shakes, healthy snacks, and healthy breakfast options.',
    iconName: 'cafe-outline',
  },
  {
    id: 'Airport Shuttle',
    title: 'Airport Shuttle',
    aliases: ['airport shuttle', 'shuttle', 'transport'],
    description: 'Shuttle service connecting to airport and transit hubs.',
    iconName: 'bus-outline',
  },
  {
    id: 'Laundry',
    title: 'Laundry',
    aliases: ['laundry', 'laundry service', 'dry cleaning'],
    description: 'Towel and workout apparel washing service.',
    iconName: 'shirt-outline',
  },
  {
    id: 'Restrooms',
    title: 'Restrooms',
    aliases: ['restrooms', 'restroom', 'washroom', 'restrooms & washrooms'],
    description: 'Hygienic and well-maintained restrooms.',
    iconName: 'man-outline',
  },
  {
    id: 'Pool',
    title: 'Pool',
    aliases: ['pool', 'swimming pool'],
    description: 'Temperature-controlled swimming pool for cardio & recovery.',
    iconName: 'boat-outline',
  },
  {
    id: 'Gym',
    title: 'Gym',
    aliases: ['gym', 'fitness center', 'weight room'],
    description: 'State-of-the-art strength & weight training area.',
    iconName: 'barbell-outline',
  },
  {
    id: 'Room',
    title: 'Room',
    aliases: ['room', 'private room', 'locker room'],
    description: 'Private rooms and locker facilities.',
    iconName: 'bed-outline',
  },
  {
    id: 'Conference',
    title: 'Conference',
    aliases: ['conference', 'meeting room', 'conference room'],
    description: 'Meeting spaces and conference rooms for members.',
    iconName: 'people-outline',
  },
  {
    id: 'Spa',
    title: 'Spa',
    aliases: ['spa', 'sauna', 'steam room', 'massage'],
    description: 'Sauna, steam room, and body recovery treatments.',
    iconName: 'sparkles-outline',
  },
  {
    id: 'Showers',
    title: 'Showers',
    aliases: ['showers', 'shower', 'shower & changing rooms', 'changing rooms'],
    description: 'Clean showers, dry lockers, and changing cubicles.',
    iconName: 'water-outline',
  },
  {
    id: 'Trainers',
    title: 'Trainers',
    aliases: ['trainers', 'trainer', 'personal trainers', 'coaching'],
    description: 'Certified fitness trainers available for guidance.',
    iconName: 'fitness-outline',
  },
];

export default function ClubAmenitiesScreen() {
  const router = useRouter();
  const { profileStatus, updateClubOwner } = useUserDetail();
  const [amenities, setAmenities] = useState<AmenityItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initializeAmenities = async () => {
      let userSelected: string[] = [];

      // 1. Extract selected amenities from profileStatus / getMe backend data
      const rawFacilities =
        profileStatus?.facilities ||
        profileStatus?.amenities ||
        profileStatus?.data?.attributes?.facilities ||
        profileStatus?.data?.attributes?.amenities ||
        profileStatus?.pendingClubOwner?.facilities;

      if (rawFacilities) {
        if (typeof rawFacilities === 'string') {
          try {
            userSelected = JSON.parse(rawFacilities);
          } catch {
            userSelected = [rawFacilities];
          }
        } else if (Array.isArray(rawFacilities)) {
          userSelected = rawFacilities;
        }
      }

      // 2. Check local draft fallback if backend data is empty
      try {
        const savedDraft = await AsyncStorage.getItem('club_amenities');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const draftEnabledTitles = parsed
              .filter((item: any) => item.isEnabled)
              .map((item: any) => item.title || item.id);

            if (userSelected.length === 0) {
              userSelected = draftEnabledTitles;
            }
          }
        }
      } catch (e) {
        console.log('Error reading local amenities draft:', e);
      }

      // 3. Map EXACT 8 MASTER_AMENITIES with boolean flags
      const mappedList: AmenityItem[] = MASTER_AMENITIES.map((item) => {
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

      setAmenities(mappedList);
    };

    initializeAmenities();
  }, [profileStatus]);

  const handleToggle = (id: string) => {
    setAmenities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isEnabled: !item.isEnabled } : item))
    );
  };

  const handleSave = async () => {
    const enabledTitles = amenities.filter((item) => item.isEnabled).map((item) => item.title);

    try {
      setIsSaving(true);

      // Save locally
      await AsyncStorage.setItem('club_amenities', JSON.stringify(amenities));

      // Save to backend via updateClubOwner mutation
      await updateClubOwner.mutateAsync({
        facilities: enabledTitles,
        amenities: enabledTitles,
      });

      Toast.show({
        type: 'success',
        text1: 'Amenities Saved! ✅',
        text2: 'Club amenities have been updated successfully.',
      });

      router.back();
    } catch (error: any) {
      console.log('Error saving amenities:', error?.response?.data || error?.message);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error?.response?.data?.message || 'Failed to sync amenities with backend.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderAmenityItem = ({ item }: { item: AmenityItem }) => (
    <View className="mb-3 flex-row items-center justify-between rounded-[8px] border border-[#E2E8F0] bg-white p-4">
      <View className="flex-row items-center flex-1 pr-4">
        {/* Icon wrapper */}
        <View className="h-12 w-12 items-center justify-center rounded-[6px] bg-[#FFF0F2]">
          <Ionicons name={item.iconName} size={22} color="#F6163C" />
        </View>

        {/* Texts */}
        <View className="ml-3 flex-1">
          <Text className="font-sans font-bold text-[14px] leading-tight text-[#1C1C1C]">
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
          Club Amenities
        </Text>
      </View>

      {/* Main List */}
      <FlatList
        data={amenities}
        renderItem={renderAmenityItem}
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
              <Text className="font-sans font-bold text-[16px] text-white ml-1">
                Save Amenities
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Container>
  );
}
