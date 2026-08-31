import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, Target } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import { LocationMapPicker, LocationMapPickerHandle } from '@/components/LocationMapPicker';
import * as Location from 'expo-location';
import { Button } from '@/components/Button';
import { MaterialIcons } from '@expo/vector-icons';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import GymLoader from '@/components/GymLoader';

const ClubLocationScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profileStatus, updateClubOwner, submitStep2 } = useUserDetail();

  const mapRef = useRef<LocationMapPickerHandle>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [region, setRegion] = useState({
    latitude: 30.7046,
    longitude: 76.7179,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [locationInfo, setLocationInfo] = useState({
    name: 'Fetching address...',
    address: 'Please wait...',
    clubAddress: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // --- 1. Load Initial Saved Data ---
  useEffect(() => {
    const loadSavedLocation = async () => {
      try {
        const pData = profileStatus?.data || profileStatus || {};
        let savedClubProfile: any = null;
        const savedData = await AsyncStorage.getItem('club_profile');
        if (savedData) savedClubProfile = JSON.parse(savedData);

        const userKey =
          profileStatus?.id ||
          profileStatus?.pendingClubOwnerId ||
          user?.id ||
          user?.email ||
          'guest';
        const onboardingStorageKey = `@onboarding_step2_map_data_${userKey}`;
        const onboardingData = await AsyncStorage.getItem(onboardingStorageKey);

        const latVal =
          pData?.latitude ||
          pData?.pendingClubOwner?.latitude ||
          savedClubProfile?.latitude ||
          (onboardingData ? JSON.parse(onboardingData)?.region?.latitude : null);

        const lngVal =
          pData?.longitude ||
          pData?.pendingClubOwner?.longitude ||
          savedClubProfile?.longitude ||
          (onboardingData ? JSON.parse(onboardingData)?.region?.longitude : null);

        if (latVal && lngVal) {
          const lat = parseFloat(String(latVal));
          const lng = parseFloat(String(lngVal));
          if (!isNaN(lat) && !isNaN(lng)) {
            const initialRegion = {
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            };
            setRegion(initialRegion);
            getAddressFromCoords(lat, lng);
            setIsInitialized(true);
            return;
          }
        }

        // Fallback to GPS position
        await getCurrentLocation();
      } catch (error) {
        console.log('Error loading saved club location:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      loadSavedLocation();
    }
  }, [profileStatus, user, isInitialized]);

  // --- 2. Reverse Geocoding via Nominatim ---
  const getAddressFromCoords = async (lat: number, lng: number) => {
    if (!lat || !lng) return;

    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            'User-Agent': 'fitfob-owner-app',
            'Accept-Language': 'en',
          },
        }
      );

      const data = await res.json();

      if (data && data.address) {
        const address = data.display_name || 'Selected Location';
        const name =
          data.address?.building ||
          data.address?.amenity ||
          data.address?.shop ||
          data.address?.office ||
          data.address?.leisure ||
          data.address?.commercial ||
          data.address?.road ||
          data.address?.suburb ||
          data.address?.city ||
          'Selected Location';

        const locationData = {
          name,
          address,
          clubAddress:
            data.address?.road ||
            data.address?.neighbourhood ||
            data.address?.suburb ||
            address,
          city:
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            '',
          state: data.address?.state || '',
          pincode: data.address?.postcode || '',
        };

        setLocationInfo(locationData);
        setSearchQuery(address);
      } else {
        const nativePlaces = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (nativePlaces && nativePlaces.length > 0) {
          const p = nativePlaces[0];
          const name = p.name || p.street || p.district || p.subregion || 'Selected Location';
          const fullAddr = [p.name, p.street, p.subregion, p.district, p.city, p.region, p.postalCode]
            .filter(Boolean)
            .join(', ');

          setLocationInfo({
            name,
            address: fullAddr || name,
            clubAddress: p.street || p.name || fullAddr || '',
            city: p.city || p.region || '',
            state: p.region || '',
            pincode: p.postalCode || '',
          });
          setSearchQuery(fullAddr || name);
        }
      }
    } catch (err) {
      console.log('Reverse geocode error, trying native fallback:', err);
      try {
        const nativePlaces = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (nativePlaces && nativePlaces.length > 0) {
          const p = nativePlaces[0];
          const name = p.name || p.street || p.district || p.subregion || 'Selected Location';
          const fullAddr = [p.name, p.street, p.subregion, p.district, p.city, p.region, p.postalCode]
            .filter(Boolean)
            .join(', ');

          setLocationInfo({
            name,
            address: fullAddr || name,
            clubAddress: p.street || p.name || fullAddr || '',
            city: p.city || p.region || '',
            state: p.region || '',
            pincode: p.postalCode || '',
          });
          setSearchQuery(fullAddr || name);
        }
      } catch (geoErr) {
        console.log('Native geocode error:', geoErr);
      }
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // --- 3. Location Search via Nominatim ---
  const handleSearchLocation = async (text: string) => {
    setSearchQuery(text);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (text.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            text
          )}&limit=5`,
          {
            headers: {
              'User-Agent': 'fitfob-owner-app',
              'Accept-Language': 'en',
            },
          }
        );

        const data = await res.json();
        setSearchResults(data || []);
      } catch (err) {
        console.log('Location search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 600);
  };

  const selectSearchResult = async (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    setSearchQuery(item.display_name);
    setSearchResults([]);

    await getAddressFromCoords(lat, lng);
  };

  // --- 4. Get Current Location ---
  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions.');
        setIsLocating(false);
        return;
      }

      let currentLocation = null;
      try {
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch {
        try {
          currentLocation = await Location.getLastKnownPositionAsync();
        } catch {
          // ignore
        }
      }

      if (currentLocation?.coords) {
        const { latitude, longitude } = currentLocation.coords;

        const newRegion = {
          ...region,
          latitude,
          longitude,
        };

        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion);
        await getAddressFromCoords(latitude, longitude);
      }
    } catch (error) {
      console.log('Error getting current location:', error);
    } finally {
      setIsLocating(false);
    }
  };

  // --- 5. Map Region Change ---
  const onRegionChangeComplete = (newRegion: any) => {
    const latDiff = Math.abs(region.latitude - newRegion.latitude);
    const lngDiff = Math.abs(region.longitude - newRegion.longitude);

    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      setRegion(newRegion);
      getAddressFromCoords(newRegion.latitude, newRegion.longitude);
    }
  };

  // --- 6. Save Location Handler ---
  const handleSaveLocation = async () => {
    if (isSaving || isReverseGeocoding) return;

    setIsSaving(true);
    const pData = profileStatus?.data || profileStatus || {};

    const payloadData: any = {
      ownerName: pData?.ownerName || pData?.owner_name || '',
      phoneNumber: pData?.phoneNumber || pData?.phone_number || '',
      email: pData?.email || '',
      clubName: pData?.clubName || pData?.club_name || '',
      latitude: String(region.latitude),
      longitude: String(region.longitude),
      clubAddress: locationInfo.address || searchQuery || 'Location Address',
      city: locationInfo.city || pData?.city || '',
      state: locationInfo.state || pData?.state || '',
      pincode: locationInfo.pincode || pData?.pincode || '',
      openingTime: pData?.openingTime || '06:00:00.000',
      closingTime: pData?.closingTime || '22:00:00.000',
      weekday: pData?.weekday || 'Monday to Friday',
      weekend: pData?.weekend || 'Saturday & Sunday',
      facilities: pData?.facilities || [],
      services: pData?.services || [],
      clubCategory: pData?.clubCategory || 'Premium',
    };

    if (pData?.logo?.id || pData?.logo) {
      payloadData.logo = typeof pData.logo === 'number' ? pData.logo : pData.logo.id;
    }

    try {
      // 1. Update backend via updateClubOwner or submitStep2
      if (updateClubOwner.mutate) {
        updateClubOwner.mutate(payloadData, {
          onSuccess: async () => {
            await syncLocalStorage();
          },
          onError: async () => {
            // Fallback to submitStep2
            submitStep2.mutate(
              {
                latitude: String(region.latitude),
                longitude: String(region.longitude),
              },
              {
                onSuccess: async () => {
                  await syncLocalStorage();
                },
                onError: (err: any) => {
                  setIsSaving(false);
                  Alert.alert(
                    'Error',
                    err?.response?.data?.message || 'Failed to update location'
                  );
                },
              }
            );
          },
        });
      } else {
        await syncLocalStorage();
      }
    } catch (e: any) {
      console.log('Error saving location:', e);
      setIsSaving(false);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const syncLocalStorage = async () => {
    try {
      const saved = await AsyncStorage.getItem('club_profile');
      const parsed = saved ? JSON.parse(saved) : {};
      const updated = {
        ...parsed,
        latitude: String(region.latitude),
        longitude: String(region.longitude),
        address: locationInfo.address || searchQuery,
        clubAddress: locationInfo.address || searchQuery,
      };
      await AsyncStorage.setItem('club_profile', JSON.stringify(updated));

      const userKey =
        profileStatus?.id ||
        profileStatus?.pendingClubOwnerId ||
        user?.id ||
        user?.email ||
        'guest';
      const STORAGE_KEY = `@onboarding_step2_map_data_${userKey}`;
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          region: {
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          locationInfo: locationInfo,
        })
      );

      Toast.show({
        type: 'success',
        text1: 'Location Updated! 📍',
        text2: 'Club location saved successfully.',
      });

      setIsSaving(false);
      router.back();
    } catch (e) {
      console.log('Storage sync error:', e);
      setIsSaving(false);
      router.back();
    }
  };

  return (
    <Container>
      <GymLoader visible={isSaving || updateClubOwner.isPending} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center py-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <ChevronLeft color="black" size={24} />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-bold text-lg text-gray-800 mr-8">
            Club Location Details
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          keyboardShouldPersistTaps="handled">
          {/* Search Input Bar */}
          <View className="relative z-[100] mt-2 mb-4">
            <Text className="text-sm text-gray-500 mb-2 ml-1">Search & Pick Location</Text>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-1">
              <MaterialIcons name="search" size={22} color="#94A3B8" />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearchLocation}
                placeholder="Search area, landmark or street..."
                placeholderTextColor="#94A3B8"
                className="ml-2 h-12 flex-1 text-slate-800 text-[15px]"
              />
              {isSearching ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <TouchableOpacity onPress={getCurrentLocation} disabled={isLocating}>
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Target size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <View className="absolute top-[82px] z-[1000] w-full rounded-2xl border border-slate-100 bg-white shadow-2xl">
                {searchResults.map((item: any, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => selectSearchResult(item)}
                    className="border-b border-slate-50 p-4">
                    <Text className="text-sm font-medium text-slate-800" numberOfLines={1}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Interactive Map View */}
          <View className="relative z-10 h-[380px] w-full overflow-hidden rounded-[32px] border border-slate-200 bg-gray-100">
            <LocationMapPicker
              ref={mapRef}
              style={{ width: '100%', height: '100%' }}
              initialRegion={region}
              onRegionChangeComplete={onRegionChangeComplete}
            />

            {/* Center Pin Marker */}
            <View
              className="absolute left-1/2 top-1/2 -ml-5 -mt-10 items-center justify-center z-20"
              pointerEvents="none">
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }}
                className="h-10 w-10"
                tintColor="#F6163C"
              />
            </View>

            {/* Floating Current Location GPS Button */}
            <TouchableOpacity
              onPress={getCurrentLocation}
              disabled={isLocating}
              className="absolute bottom-4 right-4 flex-row items-center rounded-xl bg-white px-3 py-2 shadow-lg z-30">
              {isLocating ? (
                <ActivityIndicator size="small" color="#F6163C" />
              ) : (
                <MaterialIcons name="my-location" size={18} color="#F6163C" />
              )}
              <Text className="ml-1 font-semibold text-[12px] text-slate-600">
                {isLocating ? 'Locating...' : 'Current Location'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Location Summary Card */}
          <View className="mt-4 mb-6 mx-2 rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
            <View className="mb-2 flex-row items-center">
              <View className="mr-2 rounded-full bg-red-50 p-2">
                <MaterialIcons name="location-on" size={20} color="#F6163C" />
              </View>
              <Text className="font-bold text-[16px] text-slate-800 flex-1" numberOfLines={1}>
                {locationInfo.name}
              </Text>
            </View>

            <Text className="ml-9 text-[13px] text-slate-500 leading-5" numberOfLines={3}>
              {locationInfo.address}
            </Text>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View className="mb-8 w-full flex-row gap-3 px-1">
          <View className="flex-1">
            <Button
              title={isSaving || updateClubOwner.isPending ? 'Saving...' : 'Save Location'}
              onPress={handleSaveLocation}
              disabled={isSaving || updateClubOwner.isPending || isReverseGeocoding}
              loading={isSaving || updateClubOwner.isPending}
            />
          </View>

          <View className="flex-1">
            <Button
              variant="secondary"
              title={'Cancel'}
              onPress={() => router.back()}
              disabled={isSaving || updateClubOwner.isPending}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default ClubLocationScreen;
