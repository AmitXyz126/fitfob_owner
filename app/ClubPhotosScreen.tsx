import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { ChevronLeft, Image as ImageIcon, Plus, X } from 'lucide-react-native'; // X icon add kiya
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import * as ImagePicker from 'expo-image-picker';

const ClubPhotosScreen = () => {
  const router = useRouter();
  
   const [photos, setPhotos] = useState<{id: string, uri: string}[]>([]);

  const pickImage = async () => {
    if (photos.length >= 6) {
      Alert.alert('Limit Reached', 'Aap maximum 6 photos hi upload kar sakte hain.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const newPhoto = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
      };
      setPhotos([...photos, newPhoto]);
    }
  };


  const removePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  return (
    <Container>
      <View className="flex-row items-center py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft color="black" size={24} />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-lg text-gray-800 mr-8">
          Club Photos
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="mt-4">
          <Text className="text-2xl font-black text-[#1C1C1C]">Upload Club Photos</Text>
          <Text className="mt-1 text-sm text-gray-400 leading-5">
            Upload up to 6 photos of your gym so members know what to expect
          </Text>
        </View>

        <View className="mt-8 flex-row flex-wrap justify-between">
          {/* Selected Photos */}
          {photos.map((item) => (
            <View key={item.id} className="relative mb-4 w-[48%] h-32 overflow-hidden rounded-2xl bg-gray-100">
              <Image source={{ uri: item.uri }} className="h-full w-full" resizeMode="cover" />
              {/* Delete Button */}
              <TouchableOpacity 
                onPress={() => removePhoto(item.id)}
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
              >
                <X size={14} color="white" />
              </TouchableOpacity>
            </View>
          ))}

           {Array.from({ length: 6 - photos.length }).map((_, index) => (
            <TouchableOpacity 
              key={`empty-${index}`}
              onPress={pickImage}
              className="mb-4 h-32 w-[48%] items-center justify-center rounded-2xl bg-gray-50 border border-dashed border-gray-200"
            >
              <ImageIcon size={32} color="#D1D5DB" />
              <View className="absolute bottom-2 right-2 rounded-full bg-white p-0.5 shadow-sm">
                <Plus size={12} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-6">
          <Text className="font-bold text-gray-800">Tips for high quality photos</Text>
          <View className="mt-3">
            <Text className="text-xs text-gray-500 mb-1">• Upload exactly 6 photos to showcase all facilities.</Text>
            <Text className="text-xs text-gray-500 mb-1">• High-quality images attract more members.</Text>
            <Text className="text-xs text-gray-500">• Cover gym area, reception, and changing rooms.</Text>
          </View>
        </View>
      </ScrollView>

      <View className="py-4">
        <TouchableOpacity 
          onPress={pickImage}
          disabled={photos.length >= 6}
          className={`w-full items-center justify-center rounded-2xl py-4 shadow-lg ${photos.length >= 6 ? 'bg-gray-300' : 'bg-[#EF4444] shadow-red-200'}`}
        >
          <Text className="font-bold text-white">
            {photos.length >= 6 ? 'Limit Reached' : 'Add Photos'}
          </Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
};

export default ClubPhotosScreen;