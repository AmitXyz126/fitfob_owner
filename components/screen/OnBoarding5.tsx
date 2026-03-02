import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
 import { Image as ImageIconLucide, Plus as PlusIcon, X as XIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useUserDetail } from '@/hooks/useUserDetail'; 

interface Props {
  initialData?: any;
}

const OnBoarding5 = forwardRef<any, Props>((props, ref) => {
  const { initialData } = props;
  const router = useRouter();
  const [images, setImages] = useState<(string | null)[]>(Array(6).fill(null));

  // Use hook to get mutations and latest data
  const { userData, submitStep7 } = useUserDetail();
  const isLoading = submitStep7.isPending;

  // Effect to populate images from initialData (userData)
  useEffect(() => {
    const existingPhotos =
      initialData?.clubPhotos ||
      initialData?.data?.clubPhotos ||
      initialData?.pendingClubOwner?.clubPhotos ||
      [];

    if (existingPhotos.length > 0) {
      const newImages = [...Array(6).fill(null)];
      existingPhotos.forEach((photo: any, index: number) => {
        if (index < 6) {
          newImages[index] = photo.url || photo;
        }
      });
      setImages(newImages);
    }
  }, [initialData]);

  useImperativeHandle(ref, () => ({
    handleUpload: () => {
      handleUploadLogic();
    },
  }));

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

const handleUploadLogic = () => {
  // Check if at least one photo (new or old) exists
  const hasAnyPhoto = images.some((img) => !!img);

  if (!hasAnyPhoto) {
    Alert.alert('Wait', 'Please select at least one photo!');
    return;
  }

  const selectedPhotos = images
    .map((uri, index) => {
      if (!uri) return null;

      // Skip already uploaded images (http URLs)
      if (uri.startsWith('http')) return null;

      return {
        uri,
        name: `club_photo_${index}_${Date.now()}.jpg`,
        type: 'image/jpeg',
      };
    })
    .filter((item): item is { uri: string; name: string; type: string } => item !== null);

  if (selectedPhotos.length > 0) {
    submitStep7.mutate(selectedPhotos);
  } else {
    // No new photos but old photos exist
    router.replace('/ReviewStatusScreen');
  }
};

  return (
    <View className="flex-1 bg-white p-4">
      {isLoading && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-white/50">
          <ActivityIndicator size="large" color="#F6163C" />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="mt-4">
          <Text className="font-bold text-[28px] text-slate-900">Upload Club Photos</Text>
          <Text className="mt-2 text-[14px] leading-5 text-slate-400">
            Upload great photos of your gym so members know what to expect
          </Text>
        </View>

        <View className="mt-8 flex-row flex-wrap justify-between">
          {images.map((imgUri, index) => (
            <View key={index} className="mb-4 w-[48%] overflow-hidden rounded-[20px]" style={{ height: 99 }}>
              {imgUri ? (
                <View className="relative h-full w-full bg-slate-100">
                  <Image source={{ uri: imgUri }} className="h-full w-full" resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5">
                    <XIcon size={14} color="white" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => pickImage(index)}
                  activeOpacity={0.6}
                  className="h-full w-full items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50">
                  <ImageIconLucide size={30} color="#cbd5e1" strokeWidth={1.5} />
                  <View className="absolute bottom-2 right-2 rounded-full border border-slate-100 bg-white p-1 shadow-sm">
                    <PlusIcon size={10} color="#94a3b8" strokeWidth={3} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View className="mt-4">
          <Text className="mb-3 font-bold text-[16px] text-slate-800">Tips for high quality photos</Text>
          <View className="gap-y-2">
            <View className="flex-row items-start">
              <Text className="mr-2 text-slate-400">•</Text>
              <Text className="flex-1 text-[13px] text-slate-500">
                Upload up to 6 photos showcasing your gym facilities.
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="mr-2 text-slate-400">•</Text>
              <Text className="flex-1 text-[13px] text-slate-500">
                Use high-quality images for better impression.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
});

OnBoarding5.displayName = 'OnBoarding5';

export default OnBoarding5;