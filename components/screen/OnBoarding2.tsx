/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect, useCallback } from 'react'; 
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location'; 
import { useUserDetail } from '@/hooks/useUserDetail';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOOGLE_API_KEY = 'AIzaSyB7liTs6ffq-vFE9VZH5rjbQ_ttSSFSb4o'; 
const STORAGE_KEY_MAP = '@onboarding_step2_map_data';

interface OnBoarding2Props {
  onConfirm: () => void;
}

const OnBoarding2_Part2 = ({ onConfirm }: OnBoarding2Props) => {
  const { submitStep2 } = useUserDetail();
  const [isLocalLoaded, setIsLocalLoaded] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

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
  const autoCompleteRef = useRef<any>(null);
  const isMoving = useRef(false);

  // --- 1. Load Saved Data on Mount ---
  useEffect(() => {
    const loadSavedMap = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY_MAP);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setRegion(parsed.region);
          setLocationInfo(parsed.locationInfo);
          setTimeout(() => {
            autoCompleteRef.current?.setAddressText(parsed.locationInfo.address);
            mapRef.current?.animateToRegion(parsed.region, 500);
          }, 500);
        } else {
          await getCurrentLocation();
        }
      } catch (e) {
        console.log("Error loading map storage", e);
      } finally {
        setIsLocalLoaded(true);
      }
    };
    loadSavedMap();
  }, []);

  // --- 2. Reverse Geocode with validation ---
  const getAddressFromCoords = async (lat: number, lng: number) => {
    if (!lat || !lng) return;
    
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        const name = data.results[0].address_components[1]?.long_name || 'Selected Location';
        
        autoCompleteRef.current?.setAddressText(address);
        setLocationInfo({ name, address });
        
        // Auto-save to local storage
        AsyncStorage.setItem(STORAGE_KEY_MAP, JSON.stringify({ 
          region: { ...region, latitude: lat, longitude: lng }, 
          locationInfo: { name, address } 
        }));
      }
    } catch (error) {
      console.error('Reverse Geocode Error:', error);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    let location = await Location.getCurrentPositionAsync({});
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
    if (isReverseGeocoding) return; // Wait if still fetching address

    const payload = {
      latitude: region.latitude.toString(),
      longitude: region.longitude.toString(),
    };

    submitStep2.mutate(payload, {
      onSuccess: () => {
        onConfirm();
      },
      onError: (err) => {
        console.log("Mutation Error:", err);
        Alert.alert("Error", "Failed to save location. Please try again.");
      }
    });
  };

  const onRegionChangeComplete = (newRegion: any) => {
    // Check if movement is significant to avoid infinite loops
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

      {/* Google Places Autocomplete */}
      <View className="relative z-[100] mb-4">
        <GooglePlacesAutocomplete
          ref={autoCompleteRef}
          placeholder="Search for your gym area..."
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details) {
              const { lat, lng } = details.geometry.location;
              const newRegion = {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              };
              setRegion(newRegion);
              mapRef.current?.animateToRegion(newRegion, 1000);
              const info = {
                name: data.structured_formatting?.main_text || 'Selected',
                address: details.formatted_address,
              };
              setLocationInfo(info);
              AsyncStorage.setItem(STORAGE_KEY_MAP, JSON.stringify({ region: newRegion, locationInfo: info }));
            }
          }}
          query={{ key: GOOGLE_API_KEY, language: 'en' }}
          styles={{
            container: { flex: 0 },
            textInput: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', paddingLeft: 16, color: '#475569' },
            listView: { backgroundColor: 'white', zIndex: 1000, elevation: 5 },
          }}
        />
      </View>

      {/* Map View */}
      <View className="relative z-10 h-[400px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-gray-100">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ width: '100%', height: '100%' }}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
        />
        {/* Custom Marker Pin */}
        <View className="absolute left-1/2 top-1/2 -ml-5 -mt-10 items-center justify-center" pointerEvents="none">
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }} className="h-10 w-10" tintColor="#F6163C" />
        </View>

        <TouchableOpacity onPress={getCurrentLocation} className="absolute bottom-4 right-4 flex-row items-center rounded-xl bg-white px-3 py-2 shadow-lg">
          <MaterialIcons name="my-location" size={18} color="#F6163C" />
          <Text className="ml-1 font-semibold text-[12px] text-slate-500">Current Location</Text>
        </TouchableOpacity>
      </View>

      {/* Location Details Card */}
      <View className="mt-4 rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            <View className="mr-2 rounded-full bg-red-50 p-1.5">
              <MaterialIcons name="location-on" size={18} color="#F6163C" />
            </View>
            <Text className="font-bold text-[16px] text-slate-800" numberOfLines={1}>{locationInfo.name}</Text>
          </View>
        </View>

        <Text className="mb-4 ml-8 text-[13px] text-slate-500" numberOfLines={2}>{locationInfo.address}</Text>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={submitStep2.isPending || isReverseGeocoding}
          className={`w-full flex-row items-center justify-center rounded-xl py-4 ${submitStep2.isPending || isReverseGeocoding ? 'bg-slate-300' : 'bg-[#F6163C]'}`}>
          {submitStep2.isPending ? <ActivityIndicator color="white" /> : <Text className="font-bold text-white">Confirm & Proceed</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnBoarding2_Part2;