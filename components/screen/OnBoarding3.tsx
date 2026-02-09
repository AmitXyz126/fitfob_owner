import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const OnBoarding3 = () => {
  const [city, setCity] = useState('');

   
  const mapPoints = [
    { latitude: 28.6139, longitude: 77.2090 }, // Center point
    { latitude: 28.6200, longitude: 77.2200 }, // Top point
    { latitude: 28.6000, longitude: 77.2150 }, // Bottom point
  ];

  return (
    <View className="">
      {/* --- AUTO DETECT LOCATION BOX --- */}
 
      <View className=" flex-row items-center justify-between rounded-3xl bg-slate-50 p-4 shadow-sm border border-slate-100">
        <View className="flex-row items-center flex-1">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <MaterialCommunityIcons name="map-marker-radius" size={24} color="#F6163C" />
          </View>
          <View className="ml-3">
            <Text className="font-bold text-slate-900 text-base">Auto-Detect Location</Text>
            <Text className="text-xs text-slate-400">Use your current location</Text>
          </View>
        </View>
        <TouchableOpacity className="rounded-full bg-white border border-slate-100  py-2 shadow-sm">
          <Text className="font-bold text-[#F6163C]">Enable</Text>
        </TouchableOpacity>
      </View>

      {/* --- SEARCH INPUT --- */}
      <View className="mx-4 mt-4 flex-row items-center rounded-full bg-white px-5 py-2 shadow-lg border border-slate-50 z-10">
        <TextInput
          placeholder="Enter City name..."
          className="flex-1 text-slate-600 h-10"
          value={city}
          onChangeText={setCity}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-[#F6163C]">
          <Ionicons name="search-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- MAP SECTION --- */}
      <View className="mt-6 flex-1 overflow-hidden">
        <MapView
          className="w-full h-full"
          initialRegion={{
            latitude: 28.6139,
            longitude: 77.2090,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          customMapStyle={mapStyle} // Map ko clean dikhane ke liye niche style hai
        >
          {/* Main Marker */}
          <Marker coordinate={mapPoints[0]}>
            <View className="items-center">
              <Ionicons name="location" size={50} color="#F6163C" />
              <View className="h-2 w-2 rounded-full bg-red-200 border border-white" />
            </View>
          </Marker>

          {/* Smaller Markers */}
          <Marker coordinate={mapPoints[1]}>
            <Ionicons name="location" size={30} color="#F6163C" />
          </Marker>

          <Marker coordinate={mapPoints[2]}>
            <Ionicons name="location" size={30} color="#F6163C" />
          </Marker>

          {/* Polyline like in screenshot */}
          <Polyline
            coordinates={mapPoints}
            strokeColor="#F6163C"
            strokeWidth={2}
            lineDashPattern={[5, 5]} // Dotted line effect
          />
        </MapView>
      </View>
    </View>
  );
};

// Map Style for clean look (Optional)
const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#e9e9e9" }]
  }
];

export default OnBoarding3;