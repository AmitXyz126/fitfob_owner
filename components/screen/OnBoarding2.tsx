/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import MapView, { UrlTile } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useUserDetail } from '@/hooks/useUserDetail';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnBoarding2Props {
  onConfirm: () => void;
}

const OnBoarding2 = ({ onConfirm }: OnBoarding2Props) => {
  const { profileStatus, submitStep2 } = useUserDetail();
  const userId = profileStatus?.id || profileStatus?.pendingClubOwnerId;
  const STORAGE_KEY = `@onboarding_step2_map_data_${userId || 'guest'}`;

  const [isLocalLoaded, setIsLocalLoaded] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [region, setRegion] = useState({
    latitude: 30.6791,
    longitude: 76.7303,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [locationInfo, setLocationInfo] = useState({
    name: 'Fetching location...',
    address: 'Please wait...',
  });

  const mapRef = useRef<MapView>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- 1. Load Saved Data ---
  useEffect(() => {
    const loadSavedMap = async () => {
      try {
        if (profileStatus?.latitude && profileStatus?.longitude) {
          const lat = parseFloat(profileStatus.latitude);
          const lng = parseFloat(profileStatus.longitude);
          const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          setRegion(newRegion);
          getAddressFromCoords(lat, lng);
          setIsInitialized(true);
        } else if (!isInitialized) {
          const savedData = await AsyncStorage.getItem(STORAGE_KEY);

          if (savedData) {
            const parsed = JSON.parse(savedData);

            setRegion(parsed.region);

            setLocationInfo({
              name: parsed.locationInfo.name,
              address: parsed.locationInfo.address,
            });

            setSearchQuery(parsed.locationInfo.address);
          } else {
            await getCurrentLocation();
          }
          setIsInitialized(true);
        }
      } catch (e) {
        console.log('Error loading map storage', e);
      } finally {
        setIsLocalLoaded(true);
      }
    };
    loadSavedMap();
  }, [STORAGE_KEY, profileStatus, isInitialized]);

  // --- 2. Free OSM Reverse Geocoding  ---
  const getAddressFromCoords = async (lat: number, lng: number) => {
    if (!lat || !lng) return;

    setIsReverseGeocoding(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            'User-Agent': 'gym-app',
            'Accept-Language': 'en',
          },
        }
      );

      const data = await res.json();

      if (data) {
        const address = data.display_name;

        const name =
          data.address?.road || data.address?.suburb || data.address?.city || 'Selected Location';

        const locationData = {
          name,
          address,

          clubAddress:
            data.address?.road || data.address?.neighbourhood || data.address?.suburb || '',

          city: data.address?.city || data.address?.town || data.address?.village || '',

          state: data.address?.state || '',

          pincode: data.address?.postcode || '',
        };

        setLocationInfo({
          name: locationData.name,
          address: locationData.address,
        });

        setSearchQuery(address);

        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            region: {
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            locationInfo: locationData,
          })
        );
      }
    } catch (err) {
      console.log('Reverse geocode error', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // --- 3. OSM Search  ---
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const searchLocation = async (text: any) => {
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
              'User-Agent': 'gym-app',
              'Accept-Language': 'en',
            },
          }
        );

        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.log('Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 600);
  };

  const selectSearchResult = async (item: any) => {
    const newRegion = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    setRegion(newRegion);

    mapRef.current?.animateToRegion(newRegion, 1000);

    await getAddressFromCoords(newRegion.latitude, newRegion.longitude);

    setSearchQuery(item.display_name);

    setSearchResults([]);
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission denied');
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const newRegion = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    setRegion(newRegion);

    mapRef.current?.animateToRegion(newRegion, 1000);

    getAddressFromCoords(newRegion.latitude, newRegion.longitude);
  };

  const handleConfirm = () => {
    if (isReverseGeocoding) return;
    const payload = {
      latitude: region.latitude.toString(),
      longitude: region.longitude.toString(),
    };
    submitStep2.mutate(payload, {
      onSuccess: async () => {
        await AsyncStorage.setItem('@onboarding_step', '3');
        onConfirm();
      },
      onError: () => {
        Alert.alert('Error', 'Failed to save location. Please try again.');
      },
    });
  };

  const onRegionChangeComplete = (newRegion: any) => {
    const latDiff = Math.abs(region.latitude - newRegion.latitude);
    const lngDiff = Math.abs(region.longitude - newRegion.longitude);

    if (isLocalLoaded && (latDiff > 0.0001 || lngDiff > 0.0001)) {
      setRegion(newRegion);
      getAddressFromCoords(newRegion.latitude, newRegion.longitude);
    }
  };

  return (
    <View className="flex-1 bg-white px-1">
      <Text className="mb-4 font-bold text-[26px] text-slate-900">Fill your location</Text>

      {/* --- OSM Search Input Replace Google --- */}
      <View className="relative z-[100] mb-4">
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-1">
          <MaterialIcons name="search" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Search for your gym area..."
            value={searchQuery}
            onChangeText={searchLocation}
            className="ml-2 h-12 flex-1 text-slate-600"
          />
          {isSearching && <ActivityIndicator size="small" color="#F6163C" />}
        </View>

        {searchResults.length > 0 && (
          <View className="absolute top-[58px] z-[1000] w-full rounded-xl border border-slate-100 bg-white shadow-xl">
            {searchResults.map((item: any, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => selectSearchResult(item)}
                className="border-b border-slate-50 p-4">
                <Text className="text-sm text-slate-700" numberOfLines={1}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Map View Section */}
      <View className="relative z-10 h-[400px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-gray-100">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          region={region}
          onRegionChangeComplete={onRegionChangeComplete}
          mapType="none">
          <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
        </MapView>

        {/* Center Marker */}
        <View
          className="absolute left-1/2 top-1/2 -ml-5 -mt-10 items-center justify-center"
          pointerEvents="none">
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }}
            className="h-10 w-10"
            tintColor="#F6163C"
          />
        </View>

        <TouchableOpacity
          onPress={getCurrentLocation}
          className="absolute bottom-4 right-4 flex-row items-center rounded-xl bg-white px-3 py-2 shadow-lg">
          <MaterialIcons name="my-location" size={18} color="#F6163C" />
          <Text className="ml-1 font-semibold text-[12px] text-slate-500">Current Location</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-4 rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            <View className="mr-2 rounded-full bg-red-50 p-1.5">
              <MaterialIcons name="location-on" size={18} color="#F6163C" />
            </View>
            <Text className="font-bold text-[16px] text-slate-800" numberOfLines={1}>
              {locationInfo.name}
            </Text>
          </View>
        </View>

        <Text className="mb-4 ml-8 text-[13px] text-slate-500" numberOfLines={2}>
          {locationInfo.address}
        </Text>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={submitStep2.isPending || isReverseGeocoding}
          className={`w-full flex-row items-center justify-center rounded-xl py-4 ${submitStep2.isPending || isReverseGeocoding ? 'bg-slate-300' : 'bg-[#F6163C]'}`}>
          {submitStep2.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-bold text-white">Confirm & Proceed</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnBoarding2;
