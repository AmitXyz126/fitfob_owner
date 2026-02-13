 import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const OnBoarding2_Part2 = () => {
   const [region, setRegion] = useState({
    latitude: 30.6791,
    longitude: 76.7303,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

   const [locationInfo, setLocationInfo] = useState({
    name: "CP67 Mall Mohali",
    address: "International Airport Road, Sector 67, Sahibzada Ajit Singh Nagar, Punjab 160062, India.(CP67 Mall)"
  });

  const mapRef = useRef<MapView>(null);

   const handleLocationSelect = (data: any, details: any = null) => {
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

      // Card update logic
      setLocationInfo({
        name: data.structured_formatting?.main_text || "Selected Location",
        address: details.formatted_address
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Text className="text-[26px] font-bold text-slate-900 mb-4">
        Fill your location
      </Text>

      {/* --- SEARCH BAR (Google Autocomplete) --- */}
      <View style={styles.searchWrapper}>
        <GooglePlacesAutocomplete
          placeholder="Search Location"
          fetchDetails={true}
          onPress={handleLocationSelect}
          query={{
            key: 'YOUR_GOOGLE_API_KEY',  
            language: 'en',
          }}
          renderRightButton={() => (
            <View style={{ justifyContent: 'center', paddingRight: 10 }}>
              <Ionicons name="search-outline" size={22} color="#94A3B8" />
            </View>
          )}
          styles={{
            container: { flex: 0 },
            textInput: styles.searchTextInput,
            listView: styles.searchListView,
          }}
        />
      </View>

      {/* --- MAP SECTION --- */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map} 
          initialRegion={region}
        >
          <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
             <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }} 
                style={{ width: 40, height: 40 }} 
                tintColor="#F6163C"
             />
          </Marker>
        </MapView>

        <TouchableOpacity style={styles.currentLocBtn}>
          <MaterialIcons name="my-location" size={18} color="#F6163C" />
          <Text style={{ marginLeft: 5, fontWeight: '600', color: '#64748B', fontSize: 12 }}>
            Current Location
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- ADDRESS DETAILS CARD (Dynamic Data) --- */}
      <View className="mt-4 p-4 border border-slate-100 rounded-3xl bg-white shadow-sm shadow-slate-200">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-row items-center flex-1">
             <View className="bg-red-50 p-2 rounded-full mr-2">
                <MaterialIcons name="location-on" size={20} color="#F6163C" />
             </View>
             <Text className="font-bold text-slate-900 text-[16px] flex-1" numberOfLines={1}>
               {locationInfo.name}
             </Text>
          </View>
          <TouchableOpacity className="bg-slate-100 px-3 py-1 rounded-full">
            <Text className="text-slate-500 text-xs font-bold">Change</Text>
          </TouchableOpacity>
        </View>
        
        <Text className="text-slate-400 text-[13px] leading-5 ml-10">
          {locationInfo.address}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchWrapper: {
    zIndex: 100,  
    marginBottom: 16,
  },
  searchTextInput: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#475569',
    backgroundColor: '#FFFFFF',
  },
  searchListView: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 5,
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  mapContainer: {
    height: 350,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  map: { flex: 1 },
  currentLocBtn: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  }
});

export default OnBoarding2_Part2;