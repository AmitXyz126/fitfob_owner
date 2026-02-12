import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, MapPin, Target } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button } from '@/components/Button';

const ClubLocationScreen = () => {
  const router = useRouter();
  const [locationName, setLocationName] = useState('Fetching address...');
  const [loading, setLoading] = useState(false);
  
  const [region, setRegion] = useState({
    latitude: 30.7046,
    longitude: 76.7179,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

   const getAddressFromCoords = async (lat: number, lon: number) => {
    try {
      let address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (address.length > 0) {
        const item = address[0];
         const fullAddress = `${item.name || ''} ${item.street || ''}, ${item.city || ''}`;
        setLocationName(fullAddress.trim() || "Unknown Location");
      }
    } catch (error) {
      console.log("Address fetch error", error);
    }
  };

   const getCurrentLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please enable location permissions.');
      setLoading(false);
      return;
    }

    let currentLocation = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = currentLocation.coords;

    const newRegion = { ...region, latitude, longitude };
    setRegion(newRegion);
    getAddressFromCoords(latitude, longitude);
    setLoading(false);
  };

   useEffect(() => {
    getAddressFromCoords(region.latitude, region.longitude);
  }, []);

  return (
    <Container>
      {/* Header */}
      <View className="flex-row items-center py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft color="black" size={24} />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-lg text-gray-800 mr-8">
          Club Location Details
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Input Field */}
        <View className="mt-4">
          <Text className="text-sm text-gray-500 mb-2 ml-1">Location</Text>
          <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-3">
            <TextInput
              value={locationName}
              onChangeText={setLocationName}
              className="flex-1 text-gray-800 text-[15px]"
              multiline={false}
            />
            <TouchableOpacity onPress={getCurrentLocation}>
              {loading ? <ActivityIndicator size="small" color="#EF4444" /> : <Target size={20} color="#EF4444" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Real Map */}
        <View className="mt-6 h-[420px] w-full rounded-[32px] overflow-hidden border border-blue-300 relative">
          <MapView
            style={{ width: '100%', height: '100%' }}
            region={region}
            showsCompass={false}  
            onRegionChangeComplete={(newRegion) => {
              setRegion(newRegion);
              getAddressFromCoords(newRegion.latitude, newRegion.longitude);  
            }}
          >
            {/* Center Pin */}
            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
              <View className="bg-white p-2 rounded-full shadow-md border border-gray-100">
                <MapPin size={24} color="#EF4444" fill="#EF4444" />
              </View>
            </Marker>
          </MapView>

       
        </View>
      </ScrollView>

      {/* Footer Buttons */}
     <View className="mb-10 w-full flex-row gap-3 px-1">
             {/* Save Button */}
             <View className="flex-1">
               <Button title={'Save Location '}   />
             </View>
   
             {/* Cancel Button */}
             <View className="flex-1">
               <Button variant="secondary" title={'Cancel'} onPress={() => router.back()} />
             </View>
           </View>
    </Container>
  );
};

export default ClubLocationScreen;