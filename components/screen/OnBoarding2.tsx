import React, { useState, useRef, useEffect } from 'react'; // useEffect add kiya
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location'; // Location import kiya
import { useUserDetail } from '@/hooks/useUserDetail';

const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY'; 

 interface OnBoarding2Props {
  onConfirm: () => void;
}

 const OnBoarding2_Part2 = ({ onConfirm }: OnBoarding2Props) => {
  const { submitStep2 } = useUserDetail();

  // 1. Initial Region (Default placeholder)
  const [region, setRegion] = useState({
    latitude: 30.6791,
    longitude: 76.7303,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  / 
  const [locationInfo, setLocationInfo] = useState({
    name: 'Fetching location...',
    address: 'Please wait...',
  });

  const mapRef = useRef<MapView>(null);
  const autoCompleteRef = useRef<any>(null);

  // --- CURRENT LOCATION FETCH LOGIC ---
  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationInfo({ name: 'Permission Denied', address: 'Please enable location' });
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    // Address nikalne ke liye function call kiya
    getAddressFromCoords(latitude, longitude);
  };

  // Screen load hote hi location uthao
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      if (data.results.length > 0) {
        const address = data.results[0].formatted_address;
       
        const name = data.results[0].address_components[1]?.long_name || 'Current Location';

        autoCompleteRef.current?.setAddressText(address);
        setLocationInfo({ name, address });
      }
    } catch (error) {
      console.error('Reverse Geocode Error:', error);
    }
  };

  const handleConfirm = () => {
    const payload = {
      latitude: region.latitude.toString(),
      longitude: region.longitude.toString(),
    };

    submitStep2.mutate(payload, {
      onSuccess: () => {
        onConfirm();
      },
    });
  };

  const onRegionChangeComplete = (newRegion: any) => {
    setRegion(newRegion);
    getAddressFromCoords(newRegion.latitude, newRegion.longitude);
  };

  return (
    <View className="flex-1 bg-white px-1">
      <Text className="mb-4 font-bold text-[26px] text-slate-900">Fill your location</Text>

      {/* --- SEARCH BAR --- */}
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
              mapRef.current?.animateToRegion(newRegion, 1000);
              setLocationInfo({
                name: data.structured_formatting?.main_text || 'Selected',
                address: details.formatted_address,
              });
            }
          }}
          query={{ key: GOOGLE_API_KEY, language: 'en' }}
          renderRightButton={() => (
            <TouchableOpacity className="absolute right-0 h-[56px] justify-center pr-4">
              <Ionicons name="search" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
          styles={{
            container: { flex: 0 },
            textInput: {
              height: 56,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              paddingLeft: 16,
              paddingRight: 45,
              color: '#475569',
              fontSize: 15,
            },
            listView: { backgroundColor: 'white', zIndex: 1000, elevation: 5, borderRadius: 12 },
          }}
        />
      </View>

      {/* --- MAP SECTION --- */}
      <View className="relative z-10 h-[420px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-gray-100">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ width: '100%', height: '100%' }}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
        />

        <View className="absolute left-1/2 top-1/2 -ml-5 -mt-10 items-center justify-center" pointerEvents="none">
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }}
            className="h-10 w-10"
            tintColor="#F6163C"
          />
          <View className="mt-[-2px] h-2 w-2 rounded-full bg-black/20" />
        </View>

        {/* Current Location Button ko functional banaya */}
        <TouchableOpacity 
          onPress={getCurrentLocation}
          className="absolute bottom-4 right-4 flex-row items-center rounded-xl bg-white px-3 py-2 shadow-lg" 
          style={{ elevation: 5 }}>
          <MaterialIcons name="my-location" size={18} color="#F6163C" />
          <Text className="ml-1 font-semibold text-[12px] text-slate-500">Current Location</Text>
        </TouchableOpacity>
      </View>

      {/* --- INFO CARD --- */}
      <View className="mt-4 rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm shadow-slate-300">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center pr-2">
            <View className="mr-2 rounded-full bg-red-50 p-1.5">
              <MaterialIcons name="location-on" size={18} color="#F6163C" />
            </View>
            <Text className="font-bold text-[16px] text-slate-800" numberOfLines={1}>
              {locationInfo.name}
            </Text>
          </View>

          <TouchableOpacity onPress={() => autoCompleteRef.current?.focus()} className="rounded-full bg-slate-100 px-3 py-1.5">
            <Text className="font-semibold text-[12px] text-slate-500">Change</Text>
          </TouchableOpacity>
        </View>

        <Text className="mb-4 ml-8 text-[13px] leading-5 text-slate-500" numberOfLines={3}>
          {locationInfo.address}
        </Text>

         <TouchableOpacity
          onPress={handleConfirm}
          disabled={submitStep2.isPending}
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-center rounded-xl bg-[#F6163C] py-4">
          {submitStep2.isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="font-bold text-[16px] text-white">Confirm & Proceed</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnBoarding2_Part2;