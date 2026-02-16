import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Image as ImageIcon, Plus, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const OnBoarding4 = () => {
   const [images, setImages] = useState<(string | null)[]>(Array(6).fill(null));

  const pickImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = [...images];
      newImages[index] = result.assets[0].uri;  
      setImages(newImages);
    }
  };

  const removePhoto = (index: number) => {
    const newImages = [...images];
    newImages[index] = null;  
    setImages(newImages);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* --- HEADER TEXT --- */}
        <View className="mt-4">
          <Text className="text-[28px] font-bold text-slate-900">Upload Club Photos</Text>
          <Text className="text-slate-400 text-[14px] leading-5 mt-2">
            Upload great photos of your gym so members know what to expect
          </Text>
        </View>

     {/* --- PHOTO GRID --- */}
<View className="mt-8 flex-row flex-wrap justify-between">
  {images.map((imgUri, index) => (
    <View 
      key={index} 
      className="w-[48%] mb-4 rounded-[20px] overflow-hidden"
      style={{ height: 99 }} 
    >
      {imgUri ? (
        <View className="w-full h-full relative bg-slate-100">
          <Image source={{ uri: imgUri }} className="w-full h-full" resizeMode="cover" />
          <TouchableOpacity 
            onPress={() => removePhoto(index)}
            className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5"
          >
            <X size={14} color="white" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => pickImage(index)}
          activeOpacity={0.6}
          className="w-full h-full bg-slate-50 items-center justify-center border border-dashed border-slate-200 rounded-[20px]"
        >
          <ImageIcon size={30} color="#cbd5e1" strokeWidth={1.5} />
          <View className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-sm border border-slate-100">
            <Plus size={10} color="#94a3b8" strokeWidth={3} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  ))}
</View>

        {/* --- TIPS SECTION --- */}
        <View className="mt-4">
          <Text className="text-slate-800 font-bold text-[16px] mb-3">
            Tips for high quality photos
          </Text>
          <View className="gap-y-2">
            <View className="flex-row items-start">
              <Text className="text-slate-400 mr-2">•</Text>
              <Text className="text-slate-500 text-[13px] flex-1">Upload up to 6 photos showcasing your gym facilities.</Text>
            </View>
            <View className="flex-row items-start">
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