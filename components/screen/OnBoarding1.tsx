import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // PROVIDER_GOOGLE add kiya

const OnBoarding1 = () => {
  const [clubName, setClubName] = useState('Lois');
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Hume gallery ka access chahiye.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View className="flex-1 px-4"> {/* Padding thodi badhayi hai design ke liye */}
      <Text className="text-2xl font-bold text-slate-900 mb-6">
        Fill your club details
      </Text>

      {/* --- PROFILE / LOGO UPLOAD --- */}
      <View className="items-center mb-8">
        <TouchableOpacity onPress={pickImage} activeOpacity={0.9} className="relative">
          <View className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 items-center justify-center bg-slate-50 overflow-hidden">
            {image ? (
              <Image source={{ uri: image }} className="w-full h-full" />
            ) : (
              <Ionicons name="image-outline" size={40} color="#FFC1C1" />
            )}
          </View>
          <View className="absolute bottom-0 right-0 bg-[#F6163C] w-10 h-10 rounded-full items-center justify-center border-4 border-white">
            <MaterialIcons name="photo-camera" size={18} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* --- CLUB NAME INPUT --- */}
      <View className="mb-6">
        <Text className="text-slate-400 text-sm mb-2 ml-1">Gym/ Club Name</Text>
        <TextInput
          value={clubName}
          onChangeText={setClubName}
          placeholder="Enter club name"
          className="w-full h-14 px-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium"
        />
      </View>

      {/* --- LOCATION SECTION --- */}
      <View className="mb-4">
        <Text className="text-slate-400 text-sm mb-2 ml-1">Our club location</Text>
        
        {/* Map Container - Height fixed di hai */}
        <View style={styles.mapWrapper}>
          <MapView
            provider={PROVIDER_GOOGLE} // Google Maps force karne ke liye
            style={styles.map}
            initialRegion={{
              latitude: 28.6139,
              longitude: 77.2090,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={{ latitude: 28.6139, longitude: 77.2090 }}>
               <MaterialIcons name="location-on" size={36} color="#F6163C" />
            </Marker>
          </MapView>

          {/* Floating UI */}
          <View className="absolute top-4 left-4 right-4 bg-white/95 h-14 rounded-2xl flex-row items-center px-4 shadow-sm border border-slate-100">
            <Text className="flex-1 text-slate-400">Location</Text>
            <TouchableOpacity className="bg-slate-100 px-6 py-2 rounded-xl border border-slate-200">
              <Text className="font-bold text-slate-600">Enable</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// Map ke liye explicit styles zaroori hain
const styles = StyleSheet.create({
  mapWrapper: {
    width: '100%',
    height: 250, // h-44 ke barabar
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0', // Loading ke waqt slate-200 dikhega
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default OnBoarding1;