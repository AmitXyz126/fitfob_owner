/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const OnBoarding1 = () => {
  const mapRef = useRef<MapView>(null);
  const [clubName, setClubName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('Fetching location...');

  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

   const updateAddressFromCoords = async (lat: number, lon: number) => {
    try {
      let response = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (response.length > 0) {
        const item = response[0];
        const formattedAddress = `${item.name || ''} ${item.street || ''}, ${item.city || ''}`;
        setAddress(formattedAddress.trim() || 'Unknown Location');
      }
    } catch (e) {
      console.log('Address fetch error', e);
    }
  };

   useEffect(() => {
    updateAddressFromCoords(region.latitude, region.longitude);
  }, []);

  // 2. Current Location (GPS) button logic
  const handleEnableLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location in settings.');
        setLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      mapRef.current?.animateToRegion(newRegion, 1000);
      setRegion(newRegion);
      updateAddressFromCoords(latitude, longitude);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch GPS location.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  return (
       <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="mb-6 mt-4 font-bold text-2xl text-slate-900">Fill your club details</Text>

        {/* PROFILE UPLOAD */}
        <View className="mb-8 items-center">
          <TouchableOpacity onPress={pickImage} activeOpacity={0.9} className="relative">
            <View className="h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50">
              {image ? (
                <Image source={{ uri: image }} className="h-full w-full" />
              ) : (
                <Ionicons name="image-outline" size={40} color="#FFC1C1" />
              )}
            </View>
            <View className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#F6163C]">
              <MaterialIcons name="photo-camera" size={18} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* CLUB NAME */}
        <View className="mb-6">
          <Text className="mb-2 ml-1 text-sm text-slate-500">Gym/ Club Name</Text>
          <TextInput
            value={clubName}
            onChangeText={setClubName}
            placeholder="Enter club name"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-medium text-slate-900"
          />
        </View>

        {/* LOCATION SECTION */}
        <View className="mb-4">
          <Text className="mb-2 ml-1 text-sm text-slate-500">Our club location</Text>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={region}
              showsCompass={false}
              onRegionChangeComplete={(newRegion) => {
                setRegion(newRegion);
                updateAddressFromCoords(newRegion.latitude, newRegion.longitude);
              }}>
              <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
                <View className="rounded-full border border-slate-100  bg-white p-2">
                  <MaterialIcons name="location-on" size={24} color="#F6163C" />
                </View>
              </Marker>
            </MapView>

            {/* FLOATING ADDRESS BAR */}
            <View className="absolute left-3 right-3 top-3 h-14 flex-row items-center rounded-2xl border border-slate-100 bg-white/95 px-4 shadow-sm">
              <TextInput
                placeholder={loading ? 'Fetching...' : 'Address...'}
                value={address}
                onChangeText={setAddress}
                className="mr-2 h-full flex-1 font-medium text-[11px] text-slate-600"
              />

              <TouchableOpacity
                onPress={handleEnableLocation}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-slate-100 p-2">
                {loading ? (
                  <ActivityIndicator size="small" color="#F6163C" />
                ) : (
                  <MaterialIcons name="my-location" size={20} color="#F6163C" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
   );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    height: 380,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    position: 'relative',
  },
  map: { width: '100%', height: '100%' },
});

export default OnBoarding1;
