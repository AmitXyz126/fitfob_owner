import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/Container';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Amenity {
  id: string;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isEnabled: boolean;
}

export default function ClubAmenitiesScreen() {
  const router = useRouter();
  const [amenities, setAmenities] = useState<Amenity[]>([
    {
      id: '1',
      title: 'Free High-Speed Wi-Fi',
      description: 'Complimentary high-speed internet throughout the gym floor.',
      iconName: 'wifi',
      isEnabled: true,
    },
    {
      id: '2',
      title: 'Shower & Changing Rooms',
      description: 'Clean showers, dry lockers, and changing cubicles.',
      iconName: 'water-outline',
      isEnabled: true,
    },
    {
      id: '3',
      title: 'Steam Room & Sauna',
      description: 'Relaxing post-workout dry steam sauna bath chambers.',
      iconName: 'thermometer-outline',
      isEnabled: false,
    },
    {
      id: '4',
      title: 'Personal Lockers',
      description: 'Secure, key-coded lockers to store your valuables.',
      iconName: 'lock-closed-outline',
      isEnabled: true,
    },
    {
      id: '5',
      title: 'Free Parking',
      description: 'Dedicated car and bike valet parking space for gym members.',
      iconName: 'car-outline',
      isEnabled: true,
    },
    {
      id: '6',
      title: 'Juice Bar & Café',
      description: 'Protein shakes, healthy salads, and pre-workout drinks.',
      iconName: 'cafe-outline',
      isEnabled: false,
    },
    {
      id: '7',
      title: 'Towel Service',
      description: 'Freshly laundered workout and shower towels provided.',
      iconName: 'shirt-outline',
      isEnabled: false,
    },
    {
      id: '8',
      title: 'Air Conditioning',
      description: 'Fully centralized climate control across all workout zones.',
      iconName: 'snow-outline',
      isEnabled: true,
    },
  ]);

  useEffect(() => {
    const loadSavedAmenities = async () => {
      try {
        const saved = await AsyncStorage.getItem('club_amenities');
        if (saved) {
          setAmenities(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load amenities', error);
      }
    };
    loadSavedAmenities();
  }, []);

  const handleToggle = (id: string) => {
    setAmenities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isEnabled: !item.isEnabled } : item))
    );
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('club_amenities', JSON.stringify(amenities));
      Toast.show({
        type: 'success',
        text1: 'Amenities Saved! ✅',
        text2: 'Club amenities list has been updated successfully.',
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Could not store settings at this time.',
      });
    }
  };

  const renderAmenityItem = ({ item }: { item: Amenity }) => (
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
          className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100"
        >
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
          activeOpacity={0.8}
          className="flex-row items-center justify-center rounded-2xl bg-[#F6163C] py-4 shadow-md"
        >
          <Ionicons name="save-outline" size={20} color="#FFF" />
          <Text className="font-sans font-bold text-[16px] text-white ml-1">
            Save Amenities
          </Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
}
