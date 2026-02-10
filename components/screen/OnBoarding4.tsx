import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const OnBoarding4 = () => {
 
  const [images, setImages] = useState<(string | null)[]>(Array(6).fill(null));

 
  const pickFromGallery = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const newImages = [...images];
      newImages[index] = result.assets[0].uri;
      setImages(newImages);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[26px] font-bold text-slate-900 mt-2 mb-2">
          Upload Club Photos
        </Text>
        <Text className="text-slate-400 text-[14px] leading-5 mb-2">
          Upload great photos of your gym so members know what to expect
        </Text>

        {/* --- PHOTO GRID --- */}
        <View className="flex-row flex-wrap justify-between">
          {images.map((img, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => pickFromGallery(index)} 
              activeOpacity={0.8}
              className="w-[48%] aspect-[4/3] bg-slate-50 rounded-[20px] mb-10 items-center justify-center border border-slate-100 overflow-hidden"
            >
              {img ? (
                <Image source={{ uri: img }} className="w-full h-full" />
              ) : (
                <View className="items-center justify-center">
                  <MaterialCommunityIcons name="image-plus" size={40} color="#cbd5e1" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* --- TIPS SECTION --- */}
        <View className="">
          <Text className="text-slate-800 font-bold text-[16px] mb-3">
            Tips for high quality photos
          </Text>
          <View>
            <View className="flex-row items-start mb-2">
              <Text className="text-slate-400 mr-2">•</Text>
              <Text className="text-slate-500 text-[13px] flex-1">Upload up to 6 photos showcasing your gym facilities.</Text>
            </View>
            <View className="flex-row items-start mb-2">
              <Text className="text-slate-400 mr-2">•</Text>
              <Text className="text-slate-500 text-[13px] flex-1">Use high-quality images for better impression.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-400 mr-2">•</Text>
              <Text className="text-slate-500 text-[13px] flex-1">Include from different areas: gym, yoga, pool, etc.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default OnBoarding4;